// ANTES (problema)
window.setInterval(function() {
  cargarCatalogo();
}, 60000);  // ❌ Recarga cada 60 segundos

// AHORA (solucionado)
// Deshabilitado - No recargues automáticamente
// (si necesitas actualización, implementa sin interferir con checkout)