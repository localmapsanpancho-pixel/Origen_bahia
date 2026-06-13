const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const util = require('util');
const creds = require('./credentials.json');
require('dotenv').config();

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1V_RHLYkOcg3WUxITmgOUZILHN2NB987vOCWOPrKroo4';

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, auth);

(async () => {
  await doc.loadInfo();
  console.log('title:', doc.title);
  const sheet = doc.sheetsByTitle['Pedidos_Origen'];
  if (!sheet) {
    console.log('No existe Pedidos_Origen');
    return;
  }
  console.log('sheet title:', sheet.title);
  await sheet.loadHeaderRow();
  console.log('headerValues:', sheet.headerValues);
  const rows = await sheet.getRows({ limit: 10 });
  console.log('rows count:', rows.length);
  rows.forEach((row, i) => {
    console.log('--- Row', i + 1, '---');
    console.log('rowNumber:', row.rowNumber);
    console.log('rawData:', util.inspect(row._rawData, { depth: 2, maxArrayLength: null }));
    console.log('toObject:', util.inspect(row.toObject(), { depth: 2, maxArrayLength: null }));
    const mapped = sheet.headerValues.reduce((acc, header, index) => {
      acc[header] = row._rawData[index];
      return acc;
    }, {});
    console.log('mapped by header:', util.inspect(mapped, { depth: 2 }));
  });
})();
