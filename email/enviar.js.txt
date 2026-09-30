// Uso:
//   node enviar.js --hora "6:00 p.m." --entrega "jueves 1 de octubre" --prueba tu@correo.com
//   node enviar.js --hora "6:00 p.m." --entrega "jueves 1 de octubre" --real
//
// Requiere: newsletter.csv (Google Sheets > Archivo > Descargar > CSV)
//           correo_cierre_pedidos.html en la misma carpeta
//           variable de entorno RESEND_API_KEY

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { Resend } = require('resend');

const ASUNTO = 'Hoy cerramos pedidos';
const FROM = 'Mercado Bahía <pedidos@mercadobahia.com.mx>';
const EXCLUIR = []; // correos que no deben recibirlo (pruebas internas, bajas)

// --- argumentos ---
const args = process.argv.slice(2);
const val = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const hora = val('--hora');
const entrega = val('--entrega');
const prueba = val('--prueba');
const real = args.includes('--real');

if (!prueba && !real) {
  console.error('Indica --prueba tu@correo.com o --real. Ejemplo:\n  node enviar.js --prueba tu@correo.com');
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error('Falta la variable RESEND_API_KEY');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

const html = fs.readFileSync('correo_cierre_pedidos.html', 'utf8')
  .replaceAll('[HORA DE CIERRE]', hora || '[HORA DE CIERRE]')
  .replaceAll('[DÍA DE ENTREGA]', entrega || '[DÍA DE ENTREGA]');

function leerDestinatarios() {
  if (prueba) return [prueba];
  const filas = parse(fs.readFileSync('newsletter.csv', 'utf8'), {
    columns: true, skip_empty_lines: true, relax_column_count: true, bom: true,
  });
  const vistos = new Set();
  const lista = [];
  for (const f of filas) {
    const email = (f.Email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    if (vistos.has(email) || EXCLUIR.includes(email)) continue;
    vistos.add(email);
    lista.push(email);
  }
  return lista;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const destinatarios = leerDestinatarios();
  console.log(`${real ? 'ENVÍO REAL' : 'PRUEBA'}: ${destinatarios.length} destinatario(s)`);

  for (let i = 0; i < destinatarios.length; i += 100) {
    const lote = destinatarios.slice(i, i + 100).map((to) => ({
      from: FROM, to: [to], subject: ASUNTO, html,
    }));
    const { error } = await resend.batch.send(lote);
    if (error) { console.error('Error de Resend:', error); process.exit(1); }
    console.log(`Enviados ${Math.min(i + 100, destinatarios.length)} de ${destinatarios.length}`);
    await espera(700);
  }
  console.log('Listo.');
}

main();
