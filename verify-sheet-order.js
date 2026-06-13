const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const creds = require('./credentials.json');

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet('1V_RHLYkOcg3WUxITmgOUZILHN2NB987vOCWOPrKroo4', auth);

(async () => {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Pedidos_Origen'];
    if (!sheet) {
      console.log('No existe la hoja Pedidos_Origen');
      return;
    }
    await sheet.loadHeaderRow();
    console.log('Headers:', sheet.headerValues);
    const rows = await sheet.getRows({ limit: 10 });
    console.log('Rows loaded:', rows.length);
    rows.forEach((row, index) => {
      const mapped = sheet.headerValues.reduce((acc, header, idx) => {
        acc[header] = row._rawData[idx];
        return acc;
      }, {});
      console.log(`Row ${index + 1}:`, mapped);
    });
  } catch (err) {
    console.error('ERROR', err.message || err);
  }
})();
