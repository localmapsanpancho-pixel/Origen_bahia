/**
 * ============================================================
 * NEWSLETTER — Mercado Bahía
 * ============================================================
 * Este script recibe el correo enviado desde el formulario del
 * sitio y lo agrega como fila nueva en la pestaña "Newsletter".
 *
 * INSTALACIÓN:
 * 1. Abre tu Google Sheet.
 * 2. Extensiones → Apps Script.
 * 3. Borra el código de ejemplo y pega TODO este archivo.
 * 4. Guarda (ícono de disco o Ctrl+S).
 * 5. Implementar → Nueva implementación.
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquier usuario
 * 6. Autoriza los permisos que pida Google (es tu propio script).
 * 7. Copia la URL que te da ("URL de la aplicación web") —
 *    termina en /exec. Esa es la que va en el HTML del sitio.
 * ============================================================
 */

var SHEET_NAME = "Newsletter";

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('No existe la pestaña "' + SHEET_NAME + '"');
    }

    var nombre = (e.parameter.nombre || "").toString().trim();
    var email = (e.parameter.email || "").toString().trim().toLowerCase();
    var isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nombre) {
      return respond({ result: "error", message: "Falta el nombre" });
    }
    if (!isValid) {
      return respond({ result: "error", message: "Correo inválido" });
    }

    // Evita duplicados: si el correo ya está, no lo agrega de nuevo.
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][2] || "").toString().trim().toLowerCase() === email) {
        return respond({ result: "success", message: "Ya estabas suscrito" });
      }
    }

    sheet.appendRow([new Date(), nombre, email]);
    return respond({ result: "success" });
  } catch (err) {
    return respond({ result: "error", message: err.message });
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
