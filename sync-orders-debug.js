#!/usr/bin/env node
/**
 * Script alternativo para sincronizar pedidos a Google Sheets
 * Con debug mejorado
 */

const sqlite3 = require('sqlite3').verbose();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = './pedidos.db';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1V_RHLYkOcg3WUxITmgOUZILHN2NB987vOCWOPrKroo4';
const SHEET_NAME = process.env.GOOGLE_SHEETS_TITLE || 'Pedidos_Origen';

console.log('📋 Script de Sincronización de Pedidos - Debug Mode\n');
console.log('Configuración:');
console.log(`  Google Sheets ID: ${SHEETS_ID}`);
console.log(`  Hoja: ${SHEET_NAME}`);
console.log(`  Credenciales: ${fs.existsSync('credentials.json') ? '✓ credentials.json' : '❌ No encontrado'}\n`);

// Cargar credenciales
let creds;
try {
  creds = require('./credentials.json');
  console.log(`✓ Credenciales cargadas para: ${creds.client_email}`);
} catch (e) {
  console.error('❌ Error al cargar credentials.json:', e.message);
  process.exit(1);
}

// Leer pedidos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error BD:', err.message);
    process.exit(1);
  }
});

db.all('SELECT * FROM pedidos WHERE estado = "pendiente" ORDER BY id ASC', async (err, rows) => {
  if (err) {
    console.error('❌ Error al leer pedidos:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`\n✓ ${rows.length} pedidos encontrados en SQLite\n`);

  if (rows.length === 0) {
    console.log('✓ No hay pendientes');
    db.close();
    return;
  }

  try {
    // Crear cliente JWT
    console.log('🔐 Autenticando con Google...');
    const jwt = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Crear documento
    console.log('📄 Conectando al Google Sheet...');
    const doc = new GoogleSpreadsheet(SHEETS_ID, jwt);

    // Cargar info
    console.log('⏳ Cargando información del documento...');
    await doc.loadInfo().catch(e => {
      console.error('\n❌ Error al conectar:');
      console.error('   Mensaje:', e.message);
      console.error('\n🔍 Posibles causas:');
      console.error('   1. El ID del Google Sheet es incorrecto');
      console.error('   2. La API de Google Sheets no está habilitada');
      console.error('   3. La cuenta de servicio no tiene acceso al documento');
      console.error('   4. La cuenta de servicio fue removida del documento\n');
      console.error('📝 Verifica:');
      console.error('   - URL: https://docs.google.com/spreadsheets/d/' + SHEETS_ID);
      console.error('   - Email de servicio: ' + creds.client_email);
      console.error('   - Comparte el documento con esa cuenta\n');
      throw e;
    });

    console.log('✓ Documento conectado');
    console.log('📋 Hojas disponibles:', Object.keys(doc.sheetsByTitle).join(', '));

    // Obtener o crear hoja
    let sheet = doc.sheetsByTitle[SHEET_NAME];
    if (!sheet) {
      console.log(`\n📝 Creando nueva hoja: ${SHEET_NAME}`);
      sheet = await doc.addSheet({ title: SHEET_NAME });
      await sheet.setHeaderRow(['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Metodo Pago', 'Subtotal', 'Envio', 'Total', 'Fecha']);
      console.log('✓ Hoja creada');
    }

    console.log(`\n📤 Sincronizando ${rows.length} pedidos...\n`);

    // Insertar filas
    let success = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        await sheet.addRows([{
          'ID': row.id,
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
        }]);
        console.log(`  ✓ Pedido #${row.id} - $${row.total} - ${row.nombre}`);
        success++;
      } catch (addErr) {
        console.log(`  ❌ Pedido #${row.id} - Error: ${addErr.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Sincronización: ${success} exitosos, ${failed} fallidos`);

    // Actualizar BD
    if (success > 0) {
      db.run(
        `UPDATE pedidos SET estado = 'sincronizado' WHERE id IN (${rows.slice(0, success).map(r => r.id).join(',')})`,
        (updateErr) => {
          if (updateErr) {
            console.log('⚠️  Error al actualizar BD:', updateErr.message);
          } else {
            console.log('📝 BD actualizada');
          }
          db.close();
        }
      );
    } else {
      db.close();
    }

  } catch (err) {
    console.error('\n❌ Error fatal:', err.message);
    db.close();
    process.exit(1);
  }
});
