const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const sqlite3 = require('sqlite3').verbose();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const GOOGLE_SHEETS_ID = (() => {
  const raw = process.env.GOOGLE_SHEETS_ID || '';
  const match = raw.match(/[-_a-zA-Z0-9]{20,}/);
  return match ? match[0] : raw;
})();
const GOOGLE_SHEETS_CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS || '';
const GOOGLE_SHEETS_TITLE = process.env.GOOGLE_SHEETS_TITLE || 'Pedidos_Origen';

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

if (!ACCESS_TOKEN) {
  console.warn('⚠️  No se ha definido MP_ACCESS_TOKEN en .env');
}

const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
const mpPreference = new Preference(mpConfig);

// Inicializar SQLite
const db = new sqlite3.Database('./pedidos.db', (err) => {
  if (err) console.error('Error al abrir BD:', err);
  else console.log('✓ Base de datos SQLite conectada');
});

// Crear tabla de pedidos
db.run(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT NOT NULL,
    hora_entrega TEXT NOT NULL,
    productos TEXT NOT NULL,
    total REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'pendiente'
  )
`);

// Asegurar que la columna email exista en bases de datos antiguas.
db.all("PRAGMA table_info(pedidos)", (err, rows) => {
  if (!err && Array.isArray(rows)) {
    const hasEmail = rows.some((col) => col.name === 'email');
    if (!hasEmail) {
      db.run('ALTER TABLE pedidos ADD COLUMN email TEXT', (alterErr) => {
        if (alterErr) {
          console.error('Error al agregar columna email:', alterErr);
        } else {
          console.log('✓ Columna email agregada a la tabla pedidos');
        }
      });
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => {
  const googleCredentials = loadGoogleCredentials();
  res.json({
    ok: true,
    googleSheets: {
      enabled: Boolean(GOOGLE_SHEETS_ID),
      credentialsLoaded: Boolean(googleCredentials),
      credentialsSource: GOOGLE_SHEETS_CREDENTIALS ? 'env' : fs.existsSync(path.join(__dirname, 'credentials.json')) ? 'file' : 'none',
    },
  });
});

app.post('/create_preference', async (req, res) => {
  try {
    const { items, payer } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para Mercado Pago.' });
    }

    const preference = {
      items: items.map((item) => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: 'MXN',
        picture_url: item.picture_url || undefined,
        description: item.description || undefined,
      })),
      payer: {
        name: payer?.name || 'Cliente',
        email: payer?.email || 'cliente@correo.com',
        address: payer?.address ? {
          street_name: payer.address.street_name || 'Bahía de Banderas',
          zip_code: payer.address.zip_code || '00000',
        } : undefined,
      },
      back_urls: {
        success: `${req.protocol}://${req.get('host')}/marketplace.html?status=success`,
        failure: `${req.protocol}://${req.get('host')}/marketplace.html?status=failure`,
        pending: `${req.protocol}://${req.get('host')}/marketplace.html?status=pending`,
      },
      auto_return: 'approved',
      binary_mode: true,
    };

    const response = await mpPreference.create({ body: preference });
    res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    res.status(500).json({ error: 'No se pudo crear la preferencia de pago.' });
  }
});

// Endpoint para guardar pedidos
app.post('/submit_order', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, hora, cart, total } = req.body;

    if (!nombre || !email || !direccion || !hora || !cart || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Datos incompletos del pedido.' });
    }

    // Serializar carrito
    const productosJson = JSON.stringify(cart);

    // Guardar en SQLite
    db.run(
      `INSERT INTO pedidos (nombre, email, telefono, direccion, hora_entrega, productos, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, telefono || '', direccion, hora, productosJson, total || 0],
      async function (err) {
        if (err) {
          console.error('Error al guardar en BD:', err);
          return res.status(500).json({ error: 'No se pudo guardar el pedido.' });
        }

        const pedidoId = this.lastID;
        console.log(`✓ Pedido #${pedidoId} guardado en BD`);

        // Guardar en Google Sheets (opcional)
        if (GOOGLE_SHEETS_ID) {
          const googleCredentials = loadGoogleCredentials();

          if (!googleCredentials || !googleCredentials.client_email || !googleCredentials.private_key) {
            console.warn('⚠️  Google Sheets ID definido pero no se encontraron credenciales válidas.');
          } else {
            try {
              const authClient = new JWT({
                email: googleCredentials.client_email,
                key: googleCredentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
              });

              const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, authClient);
              await doc.loadInfo();

              let sheet = doc.sheetsByTitle[GOOGLE_SHEETS_TITLE];
              if (!sheet) {
                sheet = await doc.addSheet({ title: GOOGLE_SHEETS_TITLE });
                await sheet.setHeaderRow(['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Total', 'Fecha']);
              } else {
                await sheet.loadHeaderRow();
                if (!sheet.headerValues.includes('Telefono')) {
                  await sheet.setHeaderRow(['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Total', 'Fecha']);
                }
              }

              const cartArray = Object.entries(cart).map(([id, qty]) => `Producto ${id} (${qty}u)`).join('; ');
              await sheet.addRows([{
                ID: pedidoId,
                'Nombre': nombre,
                'Email': email,
                'Telefono': telefono || '',
                'Dirección': direccion,
                'Hora': hora,
                'Productos': cartArray,
                'Total': total || 0,
                'Fecha': new Date().toLocaleString('es-MX'),
              }]);

              console.log(`✓ Pedido #${pedidoId} guardado en Google Sheets (${GOOGLE_SHEETS_TITLE})`);
            } catch (gsError) {
              console.warn('⚠️  No se pudo guardar en Google Sheets:', gsError.message);
            }
          }
        }

        res.json({ success: true, pedidoId, mensaje: `Pedido #${pedidoId} registrado exitosamente.` });
      }
    );
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    res.status(500).json({ error: 'Error al procesar el pedido.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`• Google Sheets ID: ${GOOGLE_SHEETS_ID ? 'configured' : 'MISSING'}`);
  console.log(`• Google Sheets credentials: ${GOOGLE_SHEETS_CREDENTIALS ? 'env var present' : fs.existsSync(path.join(__dirname, 'credentials.json')) ? 'local file found' : 'missing'}`);
});
