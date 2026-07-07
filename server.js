const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const sqlite3 = require('sqlite3').verbose();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const SMTP_HOST = process.env.SMTP_HOST || process.env.SMTP_SERVER || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'bahiaorigen@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || 'bahiaorigen@gmail.com';
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
    productos_detalle TEXT,
    resumen_productos TEXT,
    metodo_pago TEXT,
    subtotal REAL,
    envio REAL,
    total REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'pendiente'
  )
`);

// Asegurar que columnas nuevas existan en bases de datos antiguas.
db.all("PRAGMA table_info(pedidos)", (err, rows) => {
  if (!err && Array.isArray(rows)) {
    const existing = new Set(rows.map((col) => col.name));
    const ensureColumn = (name, type) => {
      if (!existing.has(name)) {
        db.run(`ALTER TABLE pedidos ADD COLUMN ${name} ${type}`, (alterErr) => {
          if (alterErr) console.error(`Error al agregar columna ${name}:`, alterErr);
          else console.log(`✓ Columna ${name} agregada a la tabla pedidos`);
        });
      }
    };
    ensureColumn('email', 'TEXT');
    ensureColumn('productos_detalle', 'TEXT');
    ensureColumn('resumen_productos', 'TEXT');
    ensureColumn('metodo_pago', 'TEXT');
    ensureColumn('subtotal', 'REAL');
    ensureColumn('envio', 'REAL');
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
    const {
      nombre,
      email,
      telefono,
      direccion,
      hora,
      cart,
      productos,
      resumen_productos,
      metodo_pago,
      subtotal,
      envio,
      total,
    } = req.body;

    if (!nombre || !email || !direccion || !hora || !cart || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Datos incompletos del pedido.' });
    }

    // Serializaciones para guardar
    const productosJson = JSON.stringify(cart); // compatibilidad histórica (id:qty)
    const productosDetalleJson = Array.isArray(productos) ? JSON.stringify(productos) : null;
    const metodoPagoFinal = metodo_pago || 'No especificado';
    const subtotalFinal = typeof subtotal === 'number' ? subtotal : null;
    const envioFinal = typeof envio === 'number' ? envio : null;
    // Resumen legible — usar el del frontend si llega; si no, fallback a "Producto X"
    const resumenFinal = resumen_productos
      || (Array.isArray(productos)
            ? productos.map(p => `${p.cantidad}x ${p.nombre} ($${Number(p.precio_unitario).toFixed(2)} c/u)`).join(' | ')
            : Object.entries(cart).map(([id, qty]) => `Producto ${id} (${qty}u)`).join('; '));

    // Guardar en SQLite
    db.run(
      `INSERT INTO pedidos (nombre, email, telefono, direccion, hora_entrega, productos, productos_detalle, resumen_productos, metodo_pago, subtotal, envio, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        email,
        telefono || '',
        direccion,
        hora,
        productosJson,
        productosDetalleJson,
        resumenFinal,
        metodoPagoFinal,
        subtotalFinal,
        envioFinal,
        total || 0,
      ],
      async function (err) {
        if (err) {
          console.error('Error al guardar en BD:', err);
          return res.status(500).json({ error: 'No se pudo guardar el pedido.' });
        }

        const pedidoId = this.lastID;
        console.log(`✓ Pedido #${pedidoId} guardado en BD (${metodoPagoFinal})`);

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

              // Encabezados ampliados
              const HEADERS = ['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Metodo Pago', 'Subtotal', 'Envio', 'Total', 'Fecha'];

              let sheet = doc.sheetsByTitle[GOOGLE_SHEETS_TITLE];
              if (!sheet) {
                sheet = await doc.addSheet({ title: GOOGLE_SHEETS_TITLE });
                await sheet.setHeaderRow(HEADERS);
              } else {
                await sheet.loadHeaderRow();
                const missingHeaders = HEADERS.some(h => !sheet.headerValues.includes(h));
                if (missingHeaders) {
                  // Merge: mantener orden estándar
                  await sheet.setHeaderRow(HEADERS);
                }
              }

              await sheet.addRows([{
                ID: pedidoId,
                'Nombre': nombre,
                'Email': email,
                'Telefono': telefono || '',
                'Dirección': direccion,
                'Hora': hora,
                'Productos': resumenFinal,
                'Metodo Pago': metodoPagoFinal,
                'Subtotal': subtotalFinal != null ? subtotalFinal : '',
                'Envio': envioFinal != null ? envioFinal : '',
                'Total': total || 0,
                'Fecha': new Date().toLocaleString('es-MX'),
              }]);

              console.log(`✓ Pedido #${pedidoId} guardado en Google Sheets (${GOOGLE_SHEETS_TITLE})`);
            } catch (gsError) {
              console.warn('⚠️  No se pudo guardar en Google Sheets:', gsError.message);
            }
          }
        }

        const emailSent = await sendOrderNotificationEmail({
          pedidoId,
          nombre,
          email,
          telefono: telefono || '',
          direccion,
          hora,
          resumen: resumenFinal,
          metodoPago: metodoPagoFinal,
          subtotal: subtotalFinal,
          envio: envioFinal,
          total: total || 0,
        }).catch((emailError) => {
          console.warn('⚠️  No se pudo enviar correo de notificación al admin:', emailError);
          return false;
        });

        res.json({ success: true, pedidoId, mensaje: `Pedido #${pedidoId} registrado exitosamente.`, emailSent });
      }
    );
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    res.status(500).json({ error: 'Error al procesar el pedido.' });
  }
});

// ===== ENDPOINTS CMS =====

async function sendOrderNotificationEmail({ pedidoId, nombre, email, telefono, direccion, hora, resumen, metodoPago, subtotal, envio, total }) {
  if (!SMTP_PASS) {
    console.warn('⚠️  SMTP no configurado. Saltando notificación por correo.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const orderDetailsHtml = `
    <h3>Pedido #${pedidoId}</h3>
    <p><strong>Nombre:</strong> ${nombre}</p>
    <p><strong>Email cliente:</strong> ${email || 'Sin email'}</p>
    <p><strong>Teléfono:</strong> ${telefono || 'Sin teléfono'}</p>
    <p><strong>Dirección:</strong> ${direccion}</p>
    <p><strong>Hora de entrega:</strong> ${hora}</p>
    <p><strong>Método de pago:</strong> ${metodoPago}</p>
    <p><strong>Subtotal:</strong> ${subtotal != null ? `$${subtotal.toFixed(2)}` : 'N/A'}</p>
    <p><strong>Envío:</strong> ${envio != null ? `$${envio.toFixed(2)}` : 'N/A'}</p>
    <p><strong>Total:</strong> $${Number(total).toFixed(2)}</p>
    <h4>Productos</h4>
    <p>${resumen.replace(/\n/g, '<br>')}</p>
  `;

  if (email) {
    const clientMail = {
      from: SMTP_USER,
      to: email,
      subject: `Confirmación de pedido #${pedidoId} - Origen Bahía`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f7f7f7; border-radius: 8px;">
            <div style="background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <h2 style="color: #2c5f2d;">Gracias por tu pedido</h2>
              <p>Hola ${nombre},</p>
              <p>Hemos recibido tu pedido y ya está en proceso. Estos son los detalles:</p>
              ${orderDetailsHtml}
              <p style="margin-top: 24px; color: #555;">Nos pondremos en contacto contigo por WhatsApp para confirmar la entrega.</p>
            </div>
          </div>
        </div>
      `,
    };

    const clientInfo = await transporter.sendMail(clientMail);
    console.log(`✓ Correo de confirmación enviado al cliente ${email} (${clientInfo.messageId})`);
  }

  const adminMail = {
    from: SMTP_USER,
    to: ADMIN_ORDER_EMAIL,
    subject: `Nuevo pedido confirmado #${pedidoId}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.4;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f7f7f7; border-radius: 8px;">
          <div style="background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="color: #2c5f2d;">Nuevo pedido confirmado</h2>
            ${orderDetailsHtml}
          </div>
        </div>
      </div>
    `,
  };

  const adminInfo = await transporter.sendMail(adminMail);
  console.log(`✓ Correo de pedido enviado a ${ADMIN_ORDER_EMAIL} (${adminInfo.messageId})`);
  return true;
}

// GET - Obtener todos los pedidos
app.get('/api/pedidos', (req, res) => {
  db.all(
    'SELECT * FROM pedidos ORDER BY fecha DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error al obtener pedidos:', err);
        return res.status(500).json({ error: 'Error al obtener pedidos' });
      }
      const pedidos = rows.map(row => {
        const safeParse = (str, fallback) => {
          if (!str) return fallback;
          try { return JSON.parse(str); } catch (e) { return fallback; }
        };
        return {
          ...row,
          productos: safeParse(row.productos, {}),
          productos_detalle: safeParse(row.productos_detalle, []),
        };
      });
      res.json(pedidos);
    }
  );
});

// GET - Obtener un pedido específico
app.get('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  db.get(
    'SELECT * FROM pedidos WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener pedido' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      const safeParse = (str, fallback) => {
        if (!str) return fallback;
        try { return JSON.parse(str); } catch (e) { return fallback; }
      };
      row.productos = safeParse(row.productos, {});
      row.productos_detalle = safeParse(row.productos_detalle, []);
      res.json(row);
    }
  );
});

// PATCH - Actualizar estado de un pedido
app.patch('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'Estado requerido' });
  }

  db.run(
    'UPDATE pedidos SET estado = ? WHERE id = ?',
    [estado, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar pedido' });
      }
      res.json({ success: true, id, estado });
    }
  );
});

// DELETE - Eliminar un pedido
app.delete('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  db.run(
    'DELETE FROM pedidos WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar pedido' });
      }
      res.json({ success: true, message: 'Pedido eliminado' });
    }
  );
});

// GET - Estadísticas de pedidos
app.get('/api/pedidos-stats', (req, res) => {
  db.all(
    `SELECT 
      COUNT(*) as total,
      SUM(total) as total_ingresos,
      estado,
      COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados
    FROM pedidos
    GROUP BY estado`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
      }
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`• Google Sheets ID: ${GOOGLE_SHEETS_ID ? 'configured' : 'MISSING'}`);
  console.log(`• Google Sheets credentials: ${GOOGLE_SHEETS_CREDENTIALS ? 'env var present' : fs.existsSync(path.join(__dirname, 'credentials.json')) ? 'local file found' : 'missing'}`);
});
