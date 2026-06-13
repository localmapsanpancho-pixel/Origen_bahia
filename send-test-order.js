const fetch = globalThis.fetch;

const payload = {
  nombre: 'Prueba Pages',
  email: 'prueba-pages@origenbahia.test',
  direccion: 'Calle Prueba 123',
  hora: 'Hoy 18:00',
  cart: { 1: 2, 3: 1 },
  total: 42 * 2 + 56 * 1 + 49,
};

(async () => {
  try {
    const res = await fetch('https://origen-bahia-backend.onrender.com/submit_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  } catch (err) {
    console.error('ERROR', err.message || err);
  }
})();
