#!/usr/bin/env node
/**
 * Script para sincronizar pedidos pendientes de SQLite a Google Sheets
 * Uso: node sync-pending-orders.js
 */

const sqlite3 = require('sqlite3').verbose();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ==================== CONFIGURACIÓN ====================
const DB_PATH = './pedidos.db';
const GOOGLE_SHEETS_ID = (() => {
  const raw = process.env.GOOGLE_SHEETS_ID || '';
  const match = raw.match(/[-_a-zA-Z0-9]{20,}/);
  return match ? match[0] : raw;
})();
const GOOGLE_SHEETS_CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS || '';
const GOOGLE_SHEETS_TITLE = process.env.GOOGLE_SHEETS_TITLE || 'Pedidos_Origen';

// ==================== CARGAR CREDENCIALES ====================
function loadGoogleCredentials() {
  if (GOOGLE_SHEETS_CREDENTIALS) {
    try {
      const parsed = JSON.parse(GOOGLE_SHEETS_CREDENTIALS);
      return parsed;
    } catch (parseError) {
      console.warn('⚠️  No se pudo parsear GOOGLE_SHEETS_CREDENTIALS:', parseError.message);
      return null;
    }
  }

  const credentialsPath = path.join(__dirname, 'credentials.json');
  if (fs.existsSync(credentialsPath)) {
    return require(credentialsPath);
  }

  return null;
}

// ==================== SINCRONIZAR PEDIDOS ====================
async function syncPendingOrders() {
  console.log('🔄 Iniciando sincronización de pedidos pendientes...\n');

  // Validar configuración
  if (!GOOGLE_SHEETS_ID) {
    console.error('❌ Error: GOOGLE_SHEETS_ID no está configurado en .env');
    process.exit(1);
  }

  const googleCredentials = loadGoogleCredentials();
  if (!googleCredentials) {
    console.error('❌ Error: No se encontraron credenciales de Google Sheets');
    console.log('   Asegúrate de tener credentials.json o configurar GOOGLE_SHEETS_CREDENTIALS en .env');
    process.exit(1);
  }

  // Conectar a SQLite
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error al abrir BD:', err);
      process.exit(1);
    }
    console.log('✓ Base de datos SQLite conectada');
  });

  // Leer pedidos pendientes
  db.all('SELECT * FROM pedidos WHERE estado = "pendiente" ORDER BY fecha ASC', async (err, rows) => {
    if (err) {
      console.error('❌ Error al leer pedidos:', err);
      db.close();
      process.exit(1);
    }

    console.log(`📊 Encontrados ${rows.length} pedidos pendientes\n`);

    if (rows.length === 0) {
      console.log('✓ No hay pedidos pendientes para sincronizar');
      db.close();
      return;
    }

    try {
      // Autenticar con Google
      const authClient = new JWT({
        email: googleCredentials.client_email,
        key: googleCredentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, authClient);
      await doc.loadInfo();

      // Headers del sheet
      const HEADERS = ['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Metodo Pago', 'Subtotal', 'Envio', 'Total', 'Fecha'];

      let sheet = doc.sheetsByTitle[GOOGLE_SHEETS_TITLE];
      if (!sheet) {
        console.log(`📝 Creando nueva hoja: ${GOOGLE_SHEETS_TITLE}`);
        sheet = await doc.addSheet({ title: GOOGLE_SHEETS_TITLE });
        await sheet.setHeaderRow(HEADERS);
      } else {
        console.log(`✓ Hoja encontrada: ${GOOGLE_SHEETS_TITLE}`);
        await sheet.loadHeaderRow();
      }

      // Preparar filas para insertar
      const rowsToAdd = rows.map((row) => ({
        ID: row.id,
        'Nombre': row.nombre || '',
        'Email': row.email || '',
        'Telefono': row.telefono || '',
        'Dirección': row.direccion || '',
        'Hora': row.hora_entrega || '',
        'Productos': row.resumen_productos || row.productos || '',
        'Metodo Pago': row.metodo_pago || 'No especificado',
        'Subtotal': row.subtotal != null ? row.subtotal : '',
        'Envio': row.envio != null ? row.envio : '',
        'Total': row.total || 0,
        'Fecha': row.fecha || new Date().toLocaleString('es-MX'),
      }));

      // Insertar en Google Sheets
      console.log(`\n📤 Sincronizando ${rowsToAdd.length} pedidos a Google Sheets...\n`);
      
      let successCount = 0;
      for (let i = 0; i < rowsToAdd.length; i++) {
        try {
          await sheet.addRows([rowsToAdd[i]]);
          console.log(`  ✓ Pedido #${rowsToAdd[i].ID} - ${rowsToAdd[i]['Nombre']}`);
          successCount++;
        } catch (addError) {
          console.log(`  ⚠️  Pedido #${rowsToAdd[i].ID} - Error: ${addError.message}`);
        }
      }

      console.log(`\n✅ Sincronización completada: ${successCount}/${rowsToAdd.length} pedidos`);

      // Actualizar estado en BD (opcional)
      if (successCount > 0) {
        db.run(`UPDATE pedidos SET estado = 'sincronizado' WHERE estado = 'pendiente' LIMIT ${successCount}`, (updateErr) => {
          if (!updateErr) {
            console.log('📝 Estados actualizados en BD local');
          }
        });
      }

    } catch (gsError) {
      console.error('❌ Error con Google Sheets:', gsError.message);
      process.exit(1);
    } finally {
      db.close();
    }
  });
}

// ==================== EJECUTAR ====================
syncPendingOrders();
