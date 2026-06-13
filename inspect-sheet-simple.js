const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const creds = require('./credentials.json');
require('dotenv').config();

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1V_RHLYkOcg3WUxITmgOUZILHN2NB987vOCWOPrKroo4';

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

(async () => {
  const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['Pedidos_Origen'];
  if (!sheet) {
    console.log('NO_SHEET');
    return;
  }
  console.log('HEADER_VALUES:', JSON.stringify(sheet.headerValues));
  const rows = await sheet.getRows({ limit: 5 });
  console.log('ROW_COUNT:', rows.length);
  rows.forEach((row, index) => {
    console.log('ROW_INDEX:', index + 1);
    console.log('RAW_DATA:', JSON.stringify(row._rawData));
    console.log('TO_OBJECT:', JSON.stringify(row.toObject()));
  });
})();
