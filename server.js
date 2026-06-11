const express = require('express');
const cors = require('cors');
const path = require('path');
const mercadopago = require('mercadopago');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

if (!ACCESS_TOKEN) {
  console.warn('⚠️  No se ha definido MP_ACCESS_TOKEN en .env');
}

mercadopago.configurations.setAccessToken(ACCESS_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Error creando preferencia de Mercado Pago:', error);
    res.status(500).json({ error: 'No se pudo crear la preferencia de pago.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
