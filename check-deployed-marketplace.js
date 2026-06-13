const https = require('https');
const url = 'https://localmapsanpancho-pixel.github.io/Origen_bahia/marketplace.html';
https.get(url, (res) => {
  let html = '';
  res.on('data', (chunk) => html += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    const lines = html.split(/\r?\n/).filter(line => /BACKEND_URL|submit_order|script\.js|marketplace\.html/.test(line));
    console.log('MATCHES');
    lines.forEach(line => console.log(line.trim()));
  });
}).on('error', (err) => {
  console.error('ERROR', err.message);
});
