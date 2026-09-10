/**
 * ============================================================
 * NEWSLETTER — Mercado Bahía (v2 — con ID + Origen)
 * ============================================================
 * Cambios respecto a tu versión anterior:
 * - Se agrega una columna "ID" con formato:
 *      PROMO-YYYYMMDD-HHMMSS   → vino del popup de -10%
 *      NL-YYYYMMDD-HHMMSS      → vino de cualquier otro
 *                                 formulario de newsletter del sitio
 * - Se agrega una columna "Origen" (texto libre: "promo_10",
 *   "newsletter_sitio", etc.) para que puedas filtrar en el Sheet
 *   sin tener que leer el prefijo del ID.
 * - El ID se genera aquí en el script (fuente de verdad), aunque el
 *   formulario también puede mandar uno propio — si llega uno, se
 *   respeta tal cual para no duplicar folios.
 *
 * IMPORTANTE — antes de usar esta versión:
 * 1. En tu pestaña "Newsletter", agrega dos columnas nuevas AL FINAL
 *    de tus encabezados actuales (después de Fecha, Nombre, Email):
 *        D: ID
 *        E: Origen
 *    (Así no se recorren ni se dañan tus filas ya existentes.)
 * 2. Reemplaza TODO tu Codigo.gs actual por este archivo.
 * 3. Guarda → Implementar → Administrar implementaciones →
 *    ícono de lápiz en tu implementación activa → "Nueva versión" →
 *    Implementar. (Usar la MISMA implementación para no cambiar la URL.)
 * ============================================================
 */

var SHEET_NAME = "Newsletter";
var ZONA_HORARIA = "America/Mazatlan"; // Bahía de Banderas / Nayarit

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('No existe la pestaña "' + SHEET_NAME + '"');
    }

    var nombre = (e.parameter.nombre || "").toString().trim();
    var email = (e.parameter.email || "").toString().trim().toLowerCase();
    var origen = (e.parameter.origen || "newsletter_sitio").toString().trim();
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

    // ID: si el formulario ya mandó uno (por ejemplo el popup de -10%),
    // se respeta tal cual. Si no llegó ninguno, se genera aquí.
    var id = (e.parameter.id || "").toString().trim();
    if (!id) {
      var prefijo = (origen === "promo_10") ? "PROMO" : "NL";
      var ahora = new Date();
      var fechaCompacta = Utilities.formatDate(ahora, ZONA_HORARIA, "yyyyMMdd");
      var horaCompacta = Utilities.formatDate(ahora, ZONA_HORARIA, "HHmmss");
      id = prefijo + "-" + fechaCompacta + "-" + horaCompacta;
    }

    // Fecha, Nombre, Email se mantienen en el mismo orden de siempre.
    // ID y Origen se agregan al final para no correr tus columnas actuales.
    sheet.appendRow([new Date(), nombre, email, id, origen]);

    return respond({ result: "success", id: id });
  } catch (err) {
    return respond({ result: "error", message: err.message });
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
