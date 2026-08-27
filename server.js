
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Stripe = require('stripe');
const sqlite3 = require('sqlite3').verbose();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'Mercado Bahía <pedidos@mercadobahia.com.mx>';
const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || 'bahiaorigen@gmail.com';
const SHIPPING_RATES = {
  '63729': { 'San Pancho': 50, 'Lo de Marcos': 80 },
  '63734': { 'Sayulita': 100, 'La Cruz de Huanacaxtle': 120, 'Punta de Mita': 150 },
  '63732': { 'Bucerías': 130 },
  '63735': { 'Mezcales': 150, 'Nuevo Nayarit': 150 },
  '63720': { 'Guayabitos': 150, 'La Peñita de Jaltemba': 200 },
};

function normalizeShippingValue(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function canonicalizeShippingLocality(codigoPostal, localidad) {
  if (!codigoPostal || !localidad) return null;
  const postal = String(codigoPostal).trim();
  const location = String(localidad).trim();
  const rateMap = SHIPPING_RATES[postal];
  if (!rateMap) return null;

  const normalizedInput = normalizeShippingValue(location);
  const directMatch = Object.keys(rateMap).find((candidate) => normalizeShippingValue(candidate) === normalizedInput);
  if (directMatch) return directMatch;

  const aliases = {
    'san francisco (san pancho)': 'San Pancho',
    'san pancho': 'San Pancho',
    'nuevo vallarta': 'Nuevo Nayarit',
    'nuevo nayarit': 'Nuevo Nayarit',
    'la cruz': 'La Cruz de Huanacaxtle',
    'la cruz de huanacaxtle': 'La Cruz de Huanacaxtle',
    'punta de mita': 'Punta de Mita',
    'lo de marcos': 'Lo de Marcos',
    'bucerias': 'Bucerías',
    'mezcales': 'Mezcales',
    'guayabitos': 'Guayabitos',
    'la penita de jaltemba': 'La Peñita de Jaltemba',
  };

  const canonicalName = aliases[normalizedInput];
  if (!canonicalName) return null;

  return Object.keys(rateMap).find((candidate) => normalizeShippingValue(candidate) === normalizeShippingValue(canonicalName)) || null;
}

function isValidShippingPair(codigoPostal, localidad) {
  return Boolean(canonicalizeShippingLocality(codigoPostal, localidad));
}

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

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mercadobahia.com.mx';
if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️  No se ha definido STRIPE_SECRET_KEY en .env');
}
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

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

// Pedidos que esperan confirmación de pago de Stripe (se borran al confirmarse)
db.run(`
  CREATE TABLE IF NOT EXISTS pedidos_pendientes (
    session_id TEXT PRIMARY KEY,
    datos TEXT NOT NULL,
    creado DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Mapa de sesión de Stripe -> pedido ya confirmado, para que el frontend
// pueda consultar el número de pedido y total reales al volver del pago.
db.run(`
  CREATE TABLE IF NOT EXISTS pedidos_stripe_sesiones (
    session_id TEXT PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    total REAL,
    metodo_pago TEXT,
    creado DATETIME DEFAULT CURRENT_TIMESTAMP
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

// IMPORTANTE: esta ruta va ANTES de express.json() porque Stripe necesita
// el body crudo (sin parsear) para poder verificar la firma del webhook.
app.post('/webhook-stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Firma de webhook de Stripe inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    db.get('SELECT datos FROM pedidos_pendientes WHERE session_id = ?', [session.id], async (err, row) => {
      if (err || !row) {
        console.error('⚠️  No se encontró el pedido pendiente para la sesión de Stripe', session.id);
        return;
      }

      try {
        const datos = JSON.parse(row.datos);
        const resultado = await registrarPedidoEnBD(datos);
        console.log(`✓ Pedido #${resultado.pedidoId} confirmado y guardado vía Stripe`);

        db.run(
          `INSERT OR REPLACE INTO pedidos_stripe_sesiones (session_id, pedido_id, total, metodo_pago) VALUES (?, ?, ?, ?)`,
          [session.id, resultado.pedidoId, datos.total || 0, resultado.metodoPagoFinal]
        );

        db.run('DELETE FROM pedidos_pendientes WHERE session_id = ?', [session.id]);
      } catch (procError) {
        console.error('⚠️  Error registrando pedido desde webhook de Stripe:', procError);
      }
    });
  }

  res.json({ received: true });
});

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
        success: `${FRONTEND_URL}/marketplace.html?status=success`,
        failure: `${FRONTEND_URL}/marketplace.html?status=failure`,
        pending: `${FRONTEND_URL}/marketplace.html?status=pending`,
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

// Verifica si el carrito corresponde a una suscripción (no requiere CP/localidad)
function esSuscripcion(cart, productos) {
  return Array.isArray(productos)
    ? productos.some(p => p.categoria === 'Suscripción')
    : Object.keys(cart || {}).some(k => ['basica', 'completa', 'premium_plan'].includes(k));
}

// Guarda un pedido ya confirmado (BD + Google Sheets + emails).
// La usan tanto /submit_order (efectivo/transferencia) como el webhook de Stripe.
function registrarPedidoEnBD(datos) {
  const {
    nombre, email, telefono, direccion, hora, cart, productos,
    resumen_productos, metodo_pago, subtotal, envio, total,
  } = datos;

  return new Promise((resolve, reject) => {
    const productosJson = JSON.stringify(cart || {}); // compatibilidad histórica (id:qty)
    const productosDetalleJson = Array.isArray(productos) ? JSON.stringify(productos) : null;
    const metodoPagoFinal = metodo_pago || 'No especificado';
    const subtotalFinal = typeof subtotal === 'number' ? subtotal : null;
    const envioFinal = typeof envio === 'number' ? envio : null;
    // Resumen legible — usar el del frontend si llega; si no, fallback a "Producto X"
    const resumenFinal = resumen_productos
      || (Array.isArray(productos)
            ? productos.map(p => `${p.cantidad}x ${p.nombre} ($${Number(p.precio_unitario).toFixed(2)} c/u)`).join(' | ')
            : Object.entries(cart || {}).map(([id, qty]) => `Producto ${id} (${qty}u)`).join('; '));

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
          return reject(err);
        }

        const pedidoId = this.lastID;
        console.log(`✓ Pedido #${pedidoId} guardado en BD (${metodoPagoFinal})`);

        // Proveedores únicos involucrados en el pedido (uno o varios productos pueden venir
        // de distintos proveedores). Viene del campo `productor` que script.js ya arma por
        // producto en el array `productos`. Se calcula aquí (no solo dentro del bloque de
        // Sheets) porque también se usa en el correo de confirmación.
        const proveedoresUnicos = Array.isArray(productos)
          ? [...new Set(productos.map(p => (p && p.productor ? String(p.productor).trim() : '')).filter(Boolean))]
          : [];
        const proveedoresStr = proveedoresUnicos.join(', ');

        // Fecha compartida entre la fila de Sheets y el correo, para que coincidan exactamente.
        const fechaPedido = new Date().toLocaleString('es-MX');

        // Folio autoincremental propio de la hoja (se llena solo si Google Sheets está
        // configurado, ya que la hoja es la fuente de verdad para calcularlo).
        let folio = '';

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
              // NOTA: 'Proveedor' y 'Folio' se agregan AL FINAL a propósito. Si se insertaran
              // en medio del arreglo, setHeaderRow() renombraría encabezados existentes sin
              // mover los datos ya guardados en esas columnas, desalineando filas viejas.
              const HEADERS = ['ID', 'Nombre', 'Email', 'Telefono', 'Dirección', 'Hora', 'Productos', 'Metodo Pago', 'Subtotal', 'Envio', 'Total', 'Fecha', 'Proveedor', 'Folio'];

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

              // Folio autoincremental propio (independiente del ID de la BD, que cuenta también
              // pruebas). Se calcula leyendo el folio más alto ya guardado en la hoja y sumando 1.
              // FOLIO_BASE = 20 para que el primer folio asignado sea #00021.
              const FOLIO_BASE = 20;
              try {
                const existingRows = await sheet.getRows();
                const maxFolioNum = existingRows.reduce((max, row) => {
                  const raw = row.get('Folio');
                  const num = parseInt(String(raw || '').replace(/\D/g, ''), 10);
                  return Number.isFinite(num) && num > max ? num : max;
                }, FOLIO_BASE);
                folio = `#${String(maxFolioNum + 1).padStart(5, '0')}`;
              } catch (folioError) {
                console.warn('⚠️  No se pudo calcular el folio autoincremental:', folioError.message);
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
                'Fecha': fechaPedido,
                'Proveedor': proveedoresStr,
                'Folio': folio,
              }]);

              console.log(`✓ Pedido #${pedidoId} (folio ${folio}) guardado en Google Sheets (${GOOGLE_SHEETS_TITLE})`);
            } catch (gsError) {
              console.warn('⚠️  No se pudo guardar en Google Sheets:', gsError.message);
            }
          }
        }

        // El correo se envía en segundo plano — NO se espera (await) aquí porque
        // si el SMTP tarda o se cuelga, no debe congelar la respuesta al cliente.
        sendOrderNotificationEmail({
          pedidoId,
          folio,
          nombre,
          email,
          telefono: telefono || '',
          direccion,
          hora,
          resumen: resumenFinal,
          productosDetalle: Array.isArray(productos) ? productos : null,
          proveedores: proveedoresStr,
          metodoPago: metodoPagoFinal,
          subtotal: subtotalFinal,
          envio: envioFinal,
          total: total || 0,
          fecha: fechaPedido,
        }).then((sent) => {
          if (sent) console.log(`✓ Correo del pedido #${pedidoId} enviado en segundo plano.`);
        }).catch((emailError) => {
          console.warn(`⚠️  No se pudo enviar correo de notificación del pedido #${pedidoId}:`, emailError.message || emailError);
        });

        resolve({ pedidoId, resumenFinal, metodoPagoFinal, subtotalFinal, envioFinal });
      }
    );
  });
}

// Endpoint para guardar pedidos pagados en efectivo/transferencia (confirmación inmediata)
app.post('/submit_order', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, hora, cart, productos, codigo_postal, localidad, metodo_pago, subtotal, envio, total } = req.body;
    const normalizedLocality = canonicalizeShippingLocality(codigo_postal, localidad);
    if (normalizedLocality) {
      req.body.localidad = normalizedLocality;
    }

    if (!nombre || !email || !telefono || !direccion || !hora || !metodo_pago || !cart || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Datos incompletos del pedido.' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para este pedido.' });
    }

    // Requerir CP/localidad solo para canastas (no suscripciones)
    if (!esSuscripcion(cart, productos) && (!codigo_postal || !localidad)) {
      return res.status(400).json({ error: 'Debes indicar tu código postal y zona para recibir el pedido.' });
    }

    if (!esSuscripcion(cart, productos) && !isValidShippingPair(codigo_postal, localidad)) {
      return res.status(400).json({ error: 'El código postal y localidad no coinciden con una zona de entrega válida.' });
    }

    // Asegurar que el payload del cliente no lleve datos faltantes de cálculo/confirmación.
    if (typeof subtotal !== 'number' || typeof total !== 'number' || (envio != null && typeof envio !== 'number')) {
      return res.status(400).json({ error: 'Falta información de cálculo del pedido.' });
    }

    const resultado = await registrarPedidoEnBD(req.body);

    res.json({
      success: true,
      pedidoId: resultado.pedidoId,
      mensaje: `Pedido #${resultado.pedidoId} registrado exitosamente.`,
    });
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    res.status(500).json({ error: 'Error al procesar el pedido.' });
  }
});

// Endpoint para iniciar el pago con tarjeta vía Stripe Checkout.
// El pedido NO se guarda aquí — se guarda como "pendiente" y solo se
// confirma en /webhook-stripe cuando Stripe avisa que el pago fue exitoso.
app.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      nombre, email, telefono, direccion, hora, cart, productos,
      resumen_productos, subtotal, envio, total, codigo_postal, localidad,
      metodo_pago,
    } = req.body;
    const normalizedLocality = canonicalizeShippingLocality(codigo_postal, localidad);
    if (normalizedLocality) {
      req.body.localidad = normalizedLocality;
    }

    if (!nombre || !email || !telefono || !direccion || !hora || !metodo_pago || !cart || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Datos incompletos del pedido.' });
    }

    if (!esSuscripcion(cart, productos) && (!codigo_postal || !localidad)) {
      return res.status(400).json({ error: 'Debes indicar tu código postal y zona para recibir el pedido.' });
    }

    if (!esSuscripcion(cart, productos) && !isValidShippingPair(codigo_postal, localidad)) {
      return res.status(400).json({ error: 'El código postal y localidad no coinciden con una zona de entrega válida.' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para el pago.' });
    }

    if (typeof subtotal !== 'number' || typeof total !== 'number' || (envio != null && typeof envio !== 'number')) {
      return res.status(400).json({ error: 'Falta información de cálculo del pedido.' });
    }

    const line_items = productos.map((p) => ({
      price_data: {
        currency: 'mxn',
        product_data: { name: p.nombre },
        unit_amount: Math.round(Number(p.precio_unitario) * 100),
      },
      quantity: p.cantidad,
    }));

    if (envio > 0) {
      line_items.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Envío' },
          unit_amount: Math.round(Number(envio) * 100),
        },
        quantity: 1,
      });
    }

    const emailLimpio = (email || '').trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio);
    if (!emailValido) {
      console.warn('⚠️  Email no válido recibido para Stripe, se omitirá customer_email:', email);
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe no está configurado en este entorno.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      ...(emailValido ? { customer_email: emailLimpio } : {}),
      success_url: `${FRONTEND_URL}/marketplace.html?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/marketplace.html?stripe=cancelado`,
    });

    // Guardamos los datos completos del pedido, referenciados por session_id,
    // para poder registrarlo cuando llegue la confirmación del webhook.
    const datosPedido = {
      nombre, email, telefono, direccion, hora, cart, productos,
      resumen_productos, metodo_pago: 'Tarjeta (Stripe)', subtotal, envio, total,
    };

    db.run(
      `INSERT INTO pedidos_pendientes (session_id, datos) VALUES (?, ?)`,
      [session.id, JSON.stringify(datosPedido)],
      (err) => {
        if (err) console.error('⚠️  No se pudo guardar el pedido pendiente de Stripe:', err);
      }
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: 'No se pudo iniciar el pago con tarjeta.' });
  }
});

// El frontend consulta este endpoint al volver de Stripe para mostrar
// el número de pedido y total reales (el webhook puede tardar unos segundos).
app.get('/order-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  db.get(
    'SELECT pedido_id, total, metodo_pago FROM pedidos_stripe_sesiones WHERE session_id = ?',
    [sessionId],
    (err, row) => {
      if (err) {
        console.error('Error consultando pedidos_stripe_sesiones:', err);
        return res.status(500).json({ status: 'error' });
      }
      if (row) {
        return res.json({
          status: 'confirmado',
          pedidoId: row.pedido_id,
          total: row.total,
          metodoPago: row.metodo_pago,
        });
      }

      db.get(
        'SELECT session_id FROM pedidos_pendientes WHERE session_id = ?',
        [sessionId],
        (err2, pendingRow) => {
          if (err2) return res.status(500).json({ status: 'error' });
          if (pendingRow) return res.json({ status: 'procesando' });
          return res.json({ status: 'no_encontrado' });
        }
      );
    }
  );
});

// ===== ENDPOINTS CMS =====

async function sendViaResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }
  return res.json();
}

async function sendOrderNotificationEmail({ pedidoId, folio, nombre, email, telefono, direccion, hora, resumen, productosDetalle, proveedores, metodoPago, subtotal, envio, total, fecha }) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY no configurado. Saltando notificación por correo.');
    return false;
  }

  // Etiqueta de folio para mostrar en asunto/cuerpo. Si por alguna razón no se pudo calcular
  // (p.ej. Google Sheets no configurado), se cae de vuelta al ID de la BD.
  const folioLabel = folio || `#${pedidoId}`;

  // Tabla Producto | Cantidad | Precio | Proveedor. Si `productosDetalle` no llega (pedidos
  // viejos que solo mandaban `cart` sin el array detallado), se usa el texto plano de siempre.
  const productosHtml = Array.isArray(productosDetalle) && productosDetalle.length > 0
    ? `
    <table style="width:100%; border-collapse: collapse; margin-top: 8px;">
      <thead>
        <tr style="background:#2c5f2d; color:#ffffff;">
          <th style="text-align:left; padding:8px; border:1px solid #ddd;">Producto</th>
          <th style="text-align:center; padding:8px; border:1px solid #ddd;">Cantidad</th>
          <th style="text-align:right; padding:8px; border:1px solid #ddd;">Precio</th>
          <th style="text-align:left; padding:8px; border:1px solid #ddd;">Proveedor</th>
        </tr>
      </thead>
      <tbody>
        ${productosDetalle.map(p => `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${p.nombre || 'Producto desconocido'}</td>
          <td style="text-align:center; padding:8px; border:1px solid #ddd;">${p.cantidad != null ? p.cantidad : ''}</td>
          <td style="text-align:right; padding:8px; border:1px solid #ddd;">$${Number(p.precio_unitario || 0).toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd;">${p.productor || 'N/A'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `
    : `<p>${resumen.replace(/\n/g, '<br>')}</p><p><strong>Proveedor(es):</strong> ${proveedores || 'N/A'}</p>`;

  const orderDetailsHtml = `
    <h3>Pedido ${folioLabel}</h3>
    <p><strong>ID interno:</strong> ${pedidoId}</p>
    <p><strong>Fecha:</strong> ${fecha || 'N/A'}</p>
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
    ${productosHtml}
  `;

  let clientOk = true;
  if (email) {
    try {
      const clientInfo = await sendViaResend({
        to: email,
        subject: `Confirmación de pedido ${folioLabel} - Origen Bahía`,
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
      });
      console.log(`✓ Correo de confirmación enviado al cliente ${email} (${clientInfo.id})`);
    } catch (err) {
      clientOk = false;
      console.warn(`⚠️  No se pudo enviar correo al cliente ${email}:`, err.message);
    }
  }

  try {
    const adminInfo = await sendViaResend({
      to: ADMIN_ORDER_EMAIL,
      subject: `Nuevo pedido confirmado ${folioLabel}`,
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
    });
    console.log(`✓ Correo de pedido enviado a ${ADMIN_ORDER_EMAIL} (${adminInfo.id})`);
    return clientOk;
  } catch (err) {
    console.warn(`⚠️  No se pudo enviar correo al admin ${ADMIN_ORDER_EMAIL}:`, err.message);
    return false;
  }
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
  console.log(`• Google Sheets ID: ${GOOGLE_SHEETS_ID ? 'configured' : 'MISSING'}`);
  console.log(`• Google Sheets credentials: ${GOOGLE_SHEETS_CREDENTIALS ? 'env var present' : fs.existsSync(path.join(__dirname, 'credentials.json')) ? 'local file found' : 'missing'}`);
});
