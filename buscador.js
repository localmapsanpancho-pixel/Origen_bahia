/* ============================================================
   Mercado Bahía — Buscador de productos (autocontenido)
   - Inyecta su propio HTML y CSS.
   - Muestra "Coincidencias" y "Productos similares".
   - Tolera acentos, plurales, errores de dedo y sinónimos.
   Uso en marketplace.html:
     agrega una etiqueta script con src="buscador.js?v=1" y defer
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. CONFIGURACIÓN (lo único que quizá debas ajustar) ---------- */
  const CONFIG = {
    // marketplace.html ya publica el catálogo activo en window.obProductsRef
    // (se llena cuando termina de cargar el CSV de Google Sheets).
    getProductos: () => window.obProductsRef || [],

    // Nombres de los campos dentro de cada producto de obProductsRef.
    campos: {
      id: 'id',
      nombre: 'name',
      categoria: 'category',
      productor: 'producer',
      descripcion: 'description',   // obProductsRef no la trae; se ignora si no existe
      precio: 'price',              // ya es el precio final (con descuento si aplica)
      precio_descuento: 'precio_descuento',
      imagen: 'image',
      unidad: 'unidad',
      presentacion: 'presentacion'
    },

    // Dónde colocar el buscador (primer selector que exista). Si no hay, va al inicio de <main>/<body>.
    montarEn: ['#buscador-mercado', '.market-controls', '#productGrid', 'main'],

    // Qué hacer al elegir un producto de la lista. Recibe el producto (objeto del CSV).
    // Si es null: baja a la tarjeta del producto en el catálogo y la resalta.
    alSeleccionar: null,

    maxCoincidencias: 12,
    maxSimilares: 8,
    minCaracteres: 2,
    placeholder: 'Busca un producto: miel, jitomate, pan de masa madre…'
  };

  // Sinónimos / palabras equivalentes (edítalo libremente, todo en minúsculas y sin acentos).
  const SINONIMOS = [
    ['jitomate', 'tomate'],
    ['miel', 'abeja', 'melipona'],
    ['cafe', 'cafeina'],
    ['cacao', 'chocolate'],
    ['pan', 'masa madre', 'hogaza'],
    ['aguacate', 'palta'],
    ['platano', 'banana'],
    ['frijol', 'frijoles'],
    ['leche', 'lacteo', 'lacteos'],
    ['queso', 'lacteo', 'lacteos'],
    ['verdura', 'verduras', 'hortaliza', 'vegetal'],
    ['fruta', 'frutas'],
    ['jugo', 'zumo'],
    ['especia', 'especias', 'condimento'],
    ['germinado', 'brote', 'brotes', 'microgreens'],
    ['huevo', 'gallina'],
    ['pollo', 'ave'],
    ['ayurveda', 'ayurverica', 'ayurvedica']
  ];

  /* ---------- 2. UTILIDADES DE TEXTO ---------- */
  const norm = (s) =>
    String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Singulariza de forma simple: "tomates" -> "tomate", "limones" -> "limon"
  const stem = (w) => {
    if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
    return w;
  };

  const tokens = (s) => norm(s).split(' ').filter(Boolean).map(stem);

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[a.length][b.length];
  }

  // Mapa palabra -> conjunto de equivalentes
  const SIN = new Map();
  SINONIMOS.forEach((grupo) => {
    const g = grupo.map((x) => stem(norm(x)));
    g.forEach((w) => {
      if (!SIN.has(w)) SIN.set(w, new Set());
      g.forEach((o) => o !== w && SIN.get(w).add(o));
    });
  });

  /* ---------- 3. ÍNDICE Y PUNTAJE ---------- */
  const F = CONFIG.campos;
  let cacheRef = null;
  let indice = [];

  function construirIndice() {
    const lista = CONFIG.getProductos();
    if (!Array.isArray(lista)) return [];
    if (lista === cacheRef && indice.length === lista.length) return indice;
    cacheRef = lista;
    indice = lista.map((p) => ({
      p,
      nombre: tokens(p[F.nombre]),
      nombreTxt: norm(p[F.nombre]),
      categoria: tokens(p[F.categoria]),
      productor: tokens(p[F.productor]),
      descripcion: tokens(p[F.descripcion])
    }));
    return indice;
  }

  // Puntaje de un token de búsqueda contra una lista de tokens de un campo
  function puntuarToken(q, campoTokens, peso) {
    let mejor = 0;
    const equivalentes = SIN.get(q) || new Set();
    for (const t of campoTokens) {
      let s = 0;
      if (t === q) s = 1;
      else if (equivalentes.has(t)) s = 0.75;
      else if (q.length >= 3 && t.startsWith(q)) s = 0.85;
      else if (q.length >= 4 && t.includes(q)) s = 0.6;
      else {
        const tol = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
        if (tol && lev(q, t, tol) <= tol) s = 0.5;
      }
      if (s > mejor) mejor = s;
    }
    return mejor * peso;
  }

  function puntuar(item, qTokens, qTxt) {
    let total = 0;
    let coincidenTodos = true;
    for (const q of qTokens) {
      const s = Math.max(
        puntuarToken(q, item.nombre, 10),
        puntuarToken(q, item.categoria, 4),
        puntuarToken(q, item.productor, 3),
        puntuarToken(q, item.descripcion, 2)
      );
      if (s === 0) coincidenTodos = false;
      total += s;
    }
    if (item.nombreTxt === qTxt) total += 15;
    else if (item.nombreTxt.startsWith(qTxt)) total += 6;
    if (coincidenTodos) total += 5;
    return { total, coincidenTodos };
  }

  function buscar(query) {
    const qTxt = norm(query);
    const qTokens = tokens(query);
    if (qTxt.length < CONFIG.minCaracteres || !qTokens.length) return null;

    const idx = construirIndice();
    const puntuados = idx
      .map((it) => ({ it, ...puntuar(it, qTokens, qTxt) }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);

    // Coincidencias: las que cumplen todas las palabras o tienen buen puntaje
    const umbral = 7;
    const coincidencias = puntuados
      .filter((r) => r.coincidenTodos || r.total >= umbral)
      .slice(0, CONFIG.maxCoincidencias);
    const idsCoinc = new Set(coincidencias.map((r) => r.it));

    // Similares: misma categoría que lo mejor encontrado + resultados parciales
    const base = coincidencias.length ? coincidencias : puntuados.slice(0, 3);
    const categorias = new Set();
    base.forEach((r) => r.it.categoria.forEach((c) => categorias.add(c)));

    const similares = [];
    const vistos = new Set(idsCoinc);
    // a) Parciales que no llegaron a coincidencia
    puntuados.forEach((r) => {
      if (!vistos.has(r.it) && similares.length < CONFIG.maxSimilares) {
        similares.push(r.it);
        vistos.add(r.it);
      }
    });
    // b) Misma categoría
    if (categorias.size) {
      idx.forEach((it) => {
        if (vistos.has(it) || similares.length >= CONFIG.maxSimilares) return;
        if (it.categoria.some((c) => categorias.has(c))) {
          similares.push(it);
          vistos.add(it);
        }
      });
    }

    return {
      coincidencias: coincidencias.map((r) => r.it.p),
      similares: similares.map((it) => it.p)
    };
  }

  /* ---------- 4. UI: lista desplegable ---------- */
  const fmt = (n) => {
    const v = parseFloat(String(n).replace(/[^0-9.]/g, ''));
    return isNaN(v) ? '' : '$' + v.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  function filaHTML(p, i) {
    const precio = fmt(p[F.precio]);
    const desc = fmt(p[F.precio_descuento]);
    const unidad = p[F.unidad] ? ` <small>/${esc(p[F.unidad])}</small>` : '';
    const precioHTML = desc
      ? `<span class="mb-bus-old">${precio}</span> <strong>${desc}</strong>${unidad}`
      : `<strong>${precio}</strong>${unidad}`;
    const thumb = p[F.imagen]
      ? `<img src="${esc(p[F.imagen])}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;mb-bus-noimg&quot;>🌿</span>'">`
      : '<span class="mb-bus-noimg">🌿</span>';
    const sub = [p[F.productor] || p[F.categoria] || '', p[F.presentacion] || ''].filter(Boolean).join(' · ');
    return `<div class="mb-bus-item" role="option" data-i="${i}">
      ${thumb}
      <div class="mb-bus-n">
        <div class="mb-bus-nom">${esc(p[F.nombre])}</div>
        <small>${esc(sub)}</small>
      </div>
      <div class="mb-bus-precio">${precioHTML}</div>
    </div>`;
  }

  const CSS = `
  .mb-bus{max-width:720px;margin:16px auto;padding:0 16px;font-family:Inter,system-ui,sans-serif;position:relative;z-index:50}
  .mb-bus-box{position:relative}
  .mb-bus-input{width:100%;box-sizing:border-box;padding:14px 44px 14px 18px;border:2px solid #1B3B2B;border-radius:999px;
    font:500 16px Inter,system-ui,sans-serif;color:#1B3B2B;background:#FAF9F6;outline:none}
  .mb-bus-input:focus{border-color:#B38B31;box-shadow:0 0 0 3px rgba(179,139,49,.2)}
  .mb-bus-clear{position:absolute;right:14px;top:50%;transform:translateY(-50%);border:0;background:none;
    font-size:22px;color:#8C4B33;cursor:pointer;display:none;line-height:1}
  .mb-bus-lista{position:absolute;left:0;right:0;top:calc(100% + 6px);background:#fff;border:1px solid #e7e2d6;
    border-radius:14px;box-shadow:0 12px 30px rgba(27,59,43,.18);max-height:min(70vh,460px);overflow-y:auto;display:none}
  .mb-bus-lista.abierta{display:block}
  .mb-bus-tit{position:sticky;top:0;background:#FAF9F6;padding:8px 14px;font:700 11px Poppins,Inter,sans-serif;
    letter-spacing:.06em;text-transform:uppercase;color:#1B3B2B;border-bottom:1px solid #eee9dc}
  .mb-bus-tit.sim{color:#8C4B33}
  .mb-bus-item{display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer}
  .mb-bus-item:hover,.mb-bus-item.activo{background:#FAF9F6}
  .mb-bus-item img,.mb-bus-noimg{width:38px;height:38px;border-radius:8px;object-fit:cover;flex:none;background:#FAF9F6;
    display:flex;align-items:center;justify-content:center;font-size:18px}
  .mb-bus-n{flex:1;min-width:0}
  .mb-bus-nom{font:600 14px Poppins,Inter,sans-serif;color:#1B3B2B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mb-bus-n small{color:#6b6b6b;font-size:12px}
  .mb-bus-precio{font-size:14px;color:#8C4B33;white-space:nowrap;text-align:right}
  .mb-bus-old{text-decoration:line-through;color:#999;font-size:12px}
  .mb-bus-vacio{padding:12px 14px;color:#1B3B2B;background:#FAF9F6;border-left:4px solid #B38B31;font-size:14px}
  `;

  function CSS_escape(s) {
    return window.CSS && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/"/g, '\\"');
  }

  function montar() {
    if (document.getElementById('mb-buscador')) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrap = document.createElement('section');
    wrap.id = 'mb-buscador';
    wrap.className = 'mb-bus';
    wrap.innerHTML = `
      <div class="mb-bus-box">
        <input class="mb-bus-input" type="search" autocomplete="off" role="combobox" aria-expanded="false"
               placeholder="${esc(CONFIG.placeholder)}" aria-label="Buscar productos">
        <button class="mb-bus-clear" type="button" aria-label="Limpiar búsqueda">×</button>
        <div class="mb-bus-lista" role="listbox"></div>
      </div>`;

    let destino = null;
    for (const sel of CONFIG.montarEn) {
      destino = document.querySelector(sel);
      if (destino) break;
    }
    if (destino && destino.id === 'buscador-mercado') destino.appendChild(wrap);
    else if (destino) destino.parentNode.insertBefore(wrap, destino);
    else document.body.insertBefore(wrap, document.body.firstChild);

    const input = wrap.querySelector('.mb-bus-input');
    const clear = wrap.querySelector('.mb-bus-clear');
    const lista = wrap.querySelector('.mb-bus-lista');
    let items = [];   // productos en el orden en que se muestran
    let activo = -1;

    function abrir(v) {
      lista.classList.toggle('abierta', v);
      input.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    function marcarActivo(n) {
      const filas = lista.querySelectorAll('.mb-bus-item');
      if (!filas.length) return;
      activo = (n + filas.length) % filas.length;
      filas.forEach((f, i) => f.classList.toggle('activo', i === activo));
      filas[activo].scrollIntoView({ block: 'nearest' });
    }

    function render() {
      const q = input.value;
      clear.style.display = q ? 'block' : 'none';
      const r = buscar(q);
      items = [];
      activo = -1;
      if (!r) { lista.innerHTML = ''; abrir(false); return; }

      let html = '';
      if (r.coincidencias.length) {
        html += `<div class="mb-bus-tit">Coincidencias</div>`;
        r.coincidencias.forEach((p) => { html += filaHTML(p, items.length); items.push(p); });
      } else {
        html += `<div class="mb-bus-vacio">No encontramos “${esc(q)}” exactamente.${
          r.similares.length ? ' Quizá te interese:' : ' Prueba con otra palabra.'}</div>`;
      }
      if (r.similares.length) {
        html += `<div class="mb-bus-tit sim">Productos similares</div>`;
        r.similares.forEach((p) => { html += filaHTML(p, items.length); items.push(p); });
      }
      lista.innerHTML = html;
      abrir(true);
    }

    function buscarTarjeta(p) {
      const nombre = String(p[F.nombre] || '').toLowerCase();
      const tarjetas = document.querySelectorAll('.prod-card');
      for (const c of tarjetas) if (c.getAttribute('data-nombre') === nombre) return c;
      const id = p[F.id];
      return (
        document.getElementById('producto-' + id) ||
        document.querySelector(`[data-id="${CSS_escape(id)}"]`) ||
        null
      );
    }

    function irATarjeta(p, reintento) {
      const el = buscarTarjeta(p);
      if (!el) return;
      // Si algún filtro la oculta, los limpiamos para poder mostrarla
      if (el.offsetParent === null && !reintento) {
        ['categoryFilter', 'organicFilter', 'producerFilter'].forEach((id) => {
          const sel = document.getElementById(id);
          if (sel && sel.value !== 'all') {
            sel.value = 'all';
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        setTimeout(() => irATarjeta(p, true), 80);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const prev = el.style.boxShadow, prevT = el.style.transition;
      el.style.transition = 'box-shadow .3s';
      el.style.boxShadow = '0 0 0 4px #B38B31';
      setTimeout(() => { el.style.boxShadow = prev; el.style.transition = prevT; }, 1800);
    }

    function elegir(p) {
      if (!p) return;
      input.value = p[F.nombre] || '';
      clear.style.display = input.value ? 'block' : 'none';
      abrir(false);
      if (typeof CONFIG.alSeleccionar === 'function') { CONFIG.alSeleccionar(p); return; }
      irATarjeta(p);
    }

    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 150); });
    input.addEventListener('focus', () => { if (input.value.trim().length >= CONFIG.minCaracteres) render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!lista.classList.contains('abierta')) render(); else marcarActivo(activo + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcarActivo(activo - 1); }
      else if (e.key === 'Enter') { if (items.length) { e.preventDefault(); elegir(items[activo >= 0 ? activo : 0]); } }
      else if (e.key === 'Escape') { if (lista.classList.contains('abierta')) abrir(false); else { input.value = ''; render(); } }
    });
    clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });

    lista.addEventListener('mousedown', (e) => e.preventDefault()); // no perder el foco del input
    lista.addEventListener('click', (e) => {
      const fila = e.target.closest('.mb-bus-item');
      if (fila) elegir(items[parseInt(fila.getAttribute('data-i'), 10)]);
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) abrir(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();

  // Para pruebas desde la consola: MercadoBuscador.buscar('miel')
  window.MercadoBuscador = { buscar, config: CONFIG };
})();
