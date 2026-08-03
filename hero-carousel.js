(function () {
  /* ============================================================
     CARRUSEL DE IMÁGENES DEL BANNER (header)
     ============================================================
     Hace un crossfade automático entre todas las <img class="page-banner-img">
     que haya dentro de <section class="page-banner">. No reemplaza tu
     animación de zoom (banner-zoom) — solo agrega la transición entre fotos.

     CONFIGURACIÓN:
     Cambia el tiempo (en milisegundos) que cada foto se queda en pantalla.
     ============================================================ */
  var INTERVAL_MS = 6000;

  /* El CSS del banner y el cintillo ahora vive en styles.css
     (bloque "CARRUSEL DE IMÁGENES DEL BANNER + CINTILLO DE ENVÍO GRATIS").
     Si no lo has pegado ahí todavía, este script deja de verse bien. */

  /* ==== Cintillo de envío gratis, justo debajo del banner ==== */
  var RIBBON_TEXT = " 🚚 ENTREGAS DÍAS MIÉRCOLES 🕒 PEDIDOS ANTES DEL LUNES A LAS 2PM 🚚 ENVÍO GRATIS EN COMPRAS DE $1,500 MX";
  var RIBBON_REPEATS = 8;

  function buildRibbon() {
    var ribbon = document.createElement("div");
    ribbon.className = "pb-ribbon";
    ribbon.setAttribute("role", "note");
    ribbon.setAttribute("aria-label", RIBBON_TEXT);

    var track = document.createElement("div");
    track.className = "pb-ribbon-track";

    // Se duplica el contenido dos veces para lograr el loop continuo sin salto.
    for (var rep = 0; rep < 2; rep++) {
      for (var i = 0; i < RIBBON_REPEATS; i++) {
        var item = document.createElement("span");
        item.className = "pb-ribbon-item";
        item.textContent = RIBBON_TEXT;
        track.appendChild(item);
      }
    }
    ribbon.appendChild(track);
    return ribbon;
  }

  var banner = document.querySelector(".page-banner");
  if (!banner) return;

  if (banner.parentNode && !document.querySelector(".pb-ribbon")) {
    banner.parentNode.insertBefore(buildRibbon(), banner.nextSibling);
  }

  var slides = Array.prototype.slice.call(banner.querySelectorAll(".page-banner-img"));
  if (slides.length <= 1) return; // nada que rotar

  var current = slides.findIndex(function (img) { return img.classList.contains("pb-active"); });
  if (current === -1) { current = 0; slides[0].classList.add("pb-active"); }

  var timer = null;

  function goTo(index) {
    var nextIndex = (index + slides.length) % slides.length;
    slides[current].classList.remove("pb-active");
    slides[nextIndex].classList.add("pb-active");
    current = nextIndex;
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function start() {
    if (timer) return;
    timer = setInterval(next, INTERVAL_MS);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function restart() {
    stop();
    start();
  }

  /* ==== Flechas de avanzar / retroceder ==== */
  function buildArrow(dir, label, symbol) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pb-arrow pb-" + dir;
    btn.setAttribute("aria-label", label);
    btn.innerHTML = symbol;
    btn.addEventListener("click", function () {
      if (dir === "prev") prev(); else next();
      restart(); // evita que el auto-avance se encime justo después del clic
    });
    return btn;
  }

  if (!banner.querySelector(".pb-arrow")) {
    banner.style.position = banner.style.position || "relative";
    banner.appendChild(buildArrow("prev", "Foto anterior", "&#8592;"));
    banner.appendChild(buildArrow("next", "Foto siguiente", "&#8594;"));
  }

  // Pausa la rotación si la pestaña no está visible (ahorra recursos).
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  // Respeta a quienes prefieren menos movimiento.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) start();
})();
