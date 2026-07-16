(function () {
  var SHEET_ID = "1pLfPUTP9S8fOnswXq5cdNPKk8ddXgu73";
  var GID = "1754050707";
  var CSV_URL = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=" + GID;
  var MOUNT_ID = "carrusel-productos-mount";

  var CSS = ""
    + ".cp-wrap{position:relative;display:flex;align-items:center;gap:0.75rem;max-width:1200px;margin:0 auto;}"
    + ".cp-track{display:flex;gap:1.5rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:0.5rem 0.25rem 1.25rem;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--accent-light) transparent;}"
    + ".cp-track::-webkit-scrollbar{height:6px;}"
    + ".cp-track::-webkit-scrollbar-thumb{background:var(--accent-light);border-radius:999px;}"
    + ".cp-track::-webkit-scrollbar-track{background:transparent;}"
    + ".cp-card{flex:0 0 auto;width:290px;scroll-snap-align:start;padding:1rem;gap:0.35rem;}"
    + ".cp-card .product-image{margin-bottom:0.35rem;}"
    + ".cp-name{margin:0 0 0.2rem;font-family:'Poppins',sans-serif;font-weight:600;font-size:0.95rem;color:var(--text);line-height:1.3;}"
    + ".cp-card-footer{display:flex;align-items:center;justify-content:space-between;gap:0.5rem;}"
    + ".cp-price{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.15rem;color:var(--accent);}"
    + ".cp-size{background:rgba(107,78,61,0.08);border:1px solid rgba(107,78,61,0.1);border-radius:999px;padding:0.3rem 0.7rem;font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;}"
    + ".cp-arrow{flex:0 0 auto;width:46px;height:46px;border-radius:50%;border:1px solid rgba(107,78,61,0.15);background:#fff;color:var(--accent);font-size:1.2rem;cursor:pointer;box-shadow:var(--shadow-sm);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;align-items:center;justify-content:center;}"
    + ".cp-arrow:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);}"
    + ".cp-arrow:disabled{opacity:0.35;cursor:default;transform:none;box-shadow:var(--shadow-sm);}"
    + ".cp-status{color:var(--text-secondary);padding:2rem 1rem;margin:0;}"
    + ".cp-footer{text-align:center;margin-top:2rem;}"
    + "@media (max-width:640px){"
    + ".cp-wrap{max-width:none;width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;padding:0;gap:0;}"
    + ".cp-track{gap:0;padding:0;scroll-snap-type:x mandatory;}"
    + ".cp-card{width:100vw;padding:0;border:none;box-shadow:none;border-radius:0;gap:0;}"
    + ".cp-card .product-image{border-radius:0;margin-bottom:0;aspect-ratio:1/1;}"
    + ".cp-name{padding:0.6rem 1rem 0;}"
    + ".cp-card-footer{padding:0 1rem 0.6rem;}"
    + ".cp-arrow{position:absolute;top:38%;transform:translateY(-50%);z-index:2;background:rgba(255,255,255,0.88);width:38px;height:38px;font-size:1rem;box-shadow:var(--shadow-sm);}"
    + ".cp-prev{left:0.75rem;}"
    + ".cp-next{right:0.75rem;}"
    + ".cp-arrow:disabled{opacity:0.35;cursor:default;transform:none;box-shadow:var(--shadow-sm);}" 
    + "}";

  var SECTION_HTML = ""
    + '<section id="carrusel-productos" class="section section-light">'
    + '<div class="section-header"><span>Tienda</span><h2>Nuestros productos</h2><p>Una probadita de lo que encuentras en la tienda completa.</p></div>'
    + '<div class="cp-wrap">'
    + '<button class="cp-arrow cp-prev" type="button" aria-label="Anterior" disabled>&#8592;</button>'
    + '<div class="cp-track" id="cpTrack"><p class="cp-status" id="cpStatus">Cargando productos…</p></div>'
    + '<button class="cp-arrow cp-next" type="button" aria-label="Siguiente">&#8594;</button>'
    + '</div>'
    + '<div class="cp-footer"><a class="button primary" href="marketplace.html">Ver tienda completa</a></div>'
    + '</section>';

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getMountPoint() {
    var mount = document.getElementById(MOUNT_ID);
    if (mount) return mount;
    var footer = document.querySelector("footer");
    var fallback = document.createElement("div");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(fallback, footer);
    } else {
      document.body.appendChild(fallback);
    }
    return fallback;
  }

  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else { field += c; }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === "\r") { /* ignora */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function norm(s) { return (s || "").toString().trim(); }
  function normKey(s) { return norm(s).toLowerCase(); }

  function buildProducts(rows) {
    var headerRowIndex = -1, headerColMap = {};
    for (var r = 0; r < Math.min(rows.length, 10); r++) {
      for (var c = 0; c < rows[r].length; c++) {
        if (normKey(rows[r][c]) === "nombre") { headerRowIndex = r; break; }
      }
      if (headerRowIndex !== -1) break;
    }
    if (headerRowIndex === -1) return null;

    rows[headerRowIndex].forEach(function (cell, idx) {
      var key = normKey(cell);
      if (key) headerColMap[key] = idx;
    });

    var products = [];
    for (var r2 = headerRowIndex + 1; r2 < rows.length; r2++) {
      var row = rows[r2];
      var nombre = norm(row[headerColMap["nombre"]]);
      if (!nombre) continue;

      var carrusel = headerColMap["carrusel"] !== undefined ? normKey(row[headerColMap["carrusel"]]) : "";
      var activo = headerColMap["activo"] !== undefined ? normKey(row[headerColMap["activo"]]) : "";

      if (carrusel !== "si") continue;
      if (activo === "no") continue;

      products.push({
        nombre: nombre,
        precio: norm(row[headerColMap["precio"]]),
        presentacion: norm(row[headerColMap["presentacion"]]),
        imagen: norm(row[headerColMap["imagen_url"]])
      });
    }
    return products;
  }

  function formatPrecio(precioRaw) {
    var n = parseFloat((precioRaw || "").toString().replace(/[^0-9.]/g, ""));
    if (isNaN(n)) return precioRaw || "";
    return "$" + n.toLocaleString("es-MX") + " MXN";
  }

  function render(track, status, products) {
    track.innerHTML = "";
    if (!products || !products.length) {
      status.textContent = "Aún no hay productos marcados para el carrusel.";
      track.appendChild(status);
      return;
    }
    products.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "product-card cp-card";
      card.innerHTML = ""
        + '<div class="product-image"><img src="' + p.imagen + '" alt="' + p.nombre.replace(/"/g, "&quot;") + '" loading="lazy" onerror="this.closest(\'.cp-card\').remove()" /></div>'
        + '<h4 class="cp-name">' + p.nombre.replace(/</g, "&lt;") + '</h4>'
        + '<div class="cp-card-footer"><span class="cp-price">' + formatPrecio(p.precio) + '</span>'
        + (p.presentacion ? '<span class="cp-size">' + p.presentacion + '</span>' : '')
        + '</div>';
      track.appendChild(card);
    });
  }

  function init() {
    injectStyle();
    var mount = getMountPoint();
    mount.innerHTML = SECTION_HTML;

    var track = mount.querySelector("#cpTrack");
    var status = mount.querySelector("#cpStatus");
    var prevBtn = mount.querySelector(".cp-prev");
    var nextBtn = mount.querySelector(".cp-next");

    function updateArrows() {
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function scrollByCard(dir) {
      var card = track.querySelector(".cp-card");
      var gapStr = getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0";
      var gap = parseFloat(gapStr) || 0;
      var step = card ? card.getBoundingClientRect().width + gap : 240;
      track.scrollBy({ left: dir * step, behavior: "smooth" });
    }
    prevBtn.addEventListener("click", function () { scrollByCard(-1); });
    nextBtn.addEventListener("click", function () { scrollByCard(1); });
    track.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    fetch(CSV_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var rows = parseCSV(text);
        var products = buildProducts(rows);
        if (products === null) {
          status.textContent = "No se encontraron las columnas esperadas en el Sheet.";
          return;
        }
        render(track, status, products);
        updateArrows();
      })
      .catch(function (err) {
        console.error("Carrusel de productos:", err);
        status.textContent = "No se pudo cargar el catálogo. Verifica que el Sheet esté compartido públicamente.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
