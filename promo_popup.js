/* ==========================================================================
   MERCADO BAHÍA — Popup "-10% en tu primer pedido"
   --------------------------------------------------------------------------
   Archivo autocontenido: inyecta su propio CSS y HTML, no requiere tocar
   ningún otro archivo del sitio. Solo agrega:

       <script src="promo_popup.js?v=1" defer></script>

   antes del cierre de </body> en index.html (y en marketplace.html si
   también quieres que aparezca ahí).

   QUÉ HACE
   --------------------------------------------------------------------------
   1. Muestra el popup ~1.5s después de cargar la página, solo si la persona
      no lo ha cerrado ni se ha suscrito antes (usa localStorage).
   2. Si cierra el popup con la X, no vuelve a aparecer por 30 días.
   3. Si se suscribe, no vuelve a aparecer nunca (queda marcado como
      "ya_suscrito").
   4. Genera un ID único con fecha y hora para cada registro, con un
      prefijo distinto según el origen:
           PROMO-20260828-143521   → vino del popup de -10%
           NL-20260828-143521      → vino de un formulario de newsletter
                                      normal (ver función pública abajo)
   5. Envía los datos (id, nombre, email, origen, fecha, hora) al mismo
      endpoint de Google Apps Script que ya usas para newsletter.

   ⚠️ PENDIENTE DE TU PARTE (ver CONFIG abajo)
   --------------------------------------------------------------------------
   - ENDPOINT_URL: pega aquí la URL /exec de tu Apps Script de newsletter
     (la misma de siempre — solo asegúrate de haber actualizado el script
     a la versión "Codigo_newsletter_v2.gs" que agrega las columnas
     ID y Origen antes de volver a implementar).
   - IMAGEN_FONDO_URL: ruta de la foto de fondo del popup.
   ========================================================================== */

(function () {
  "use strict";

  // ------------------------------------------------------------------------
  // CONFIG — edita solo esta sección
  // ------------------------------------------------------------------------
  const CONFIG = {
    // TODO: pega aquí la URL de tu Apps Script de newsletter (doPost)
    ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbzwh8mXSLg8fh44XErdZvsbjX5zvPBSpRPzpnue9o2qITpjpnh1jO-tB9dnG7o2-icF/exec",

    // Cada cuántos días vuelve a aparecer si la persona lo cerró sin suscribirse
    DIAS_REAPARICION: 30,

    // Milisegundos antes de mostrar el popup al entrar al sitio
    RETRASO_MS: 1500,

    // TODO: sube la foto de la canasta a tu repo (ej. /img_mp/promo-fondo.jpg)
    // y pon aquí la ruta o URL completa.
    IMAGEN_FONDO_URL: "img_mp/promo-fondo.jpg",

    // Zona horaria para el formato de fecha/hora que se manda al backend
    ZONA_HORARIA_OFFSET_HORAS: -6, // Bahía de Banderas / Nayarit (CST, sin DST en Nayarit continental)

    STORAGE_KEY: "mb_promo10_status", // valores: 'cerrado_<timestamp>' | 'suscrito'
  };

  // ------------------------------------------------------------------------
  // Utilidades de ID / fecha-hora
  // ------------------------------------------------------------------------
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function obtenerFechaHora() {
    const d = new Date();
    const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const fechaCompacta = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const horaCompacta = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return { fecha, hora, fechaCompacta, horaCompacta };
  }

  // prefijo: 'PROMO' o 'NL'
  function generarId(prefijo) {
    const { fechaCompacta, horaCompacta } = obtenerFechaHora();
    return `${prefijo}-${fechaCompacta}-${horaCompacta}`;
  }

  // Función pública reutilizable: cualquier otro formulario de newsletter
  // del sitio puede llamar a window.MB_registrarNewsletter({nombre, email})
  // y va a generar su propio ID con prefijo NL- y mandarlo al mismo endpoint.
  window.MB_registrarNewsletter = function (datos) {
    return enviarRegistro({
      nombre: datos.nombre || "",
      email: datos.email,
      origen: datos.origen || "newsletter_sitio",
      prefijoId: "NL",
    });
  };

  function enviarRegistro({ nombre, email, origen, prefijoId }) {
    const { fecha, hora } = obtenerFechaHora();
    const id = generarId(prefijoId);

    if (!CONFIG.ENDPOINT_URL || CONFIG.ENDPOINT_URL.indexOf("PON_AQUI") === 0) {
      console.warn(
        "[Mercado Bahía] Falta configurar CONFIG.ENDPOINT_URL en promo_popup.js. " +
          "Este registro no se envió:",
        { id, nombre, email, origen, fecha, hora }
      );
      return Promise.reject(new Error("ENDPOINT_URL no configurado"));
    }

    // El Apps Script de newsletter lee e.parameter, así que se manda como
    // application/x-www-form-urlencoded (no JSON).
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("nombre", nombre);
    params.set("email", email);
    params.set("origen", origen);
    params.set("fecha", fecha);
    params.set("hora", hora);

    return fetch(CONFIG.ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Respuesta no OK: " + res.status);
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        if (data && data.result === "error") {
          throw new Error(data.message || "Error del servidor");
        }
        return data;
      });
  }

  // ------------------------------------------------------------------------
  // Lógica de visibilidad (no ser molesto)
  // ------------------------------------------------------------------------
  function debeMostrarse() {
    try {
      const estado = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!estado) return true;
      if (estado === "suscrito") return false;
      if (estado.indexOf("cerrado_") === 0) {
        const ts = parseInt(estado.replace("cerrado_", ""), 10);
        const diasPasados = (Date.now() - ts) / (1000 * 60 * 60 * 24);
        return diasPasados >= CONFIG.DIAS_REAPARICION;
      }
      return true;
    } catch (e) {
      return true; // si localStorage falla, mejor mostrar que no mostrar
    }
  }

  function marcarCerrado() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, "cerrado_" + Date.now());
    } catch (e) {}
  }

  function marcarSuscrito() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, "suscrito");
    } catch (e) {}
  }

  // ------------------------------------------------------------------------
  // Estilos
  // ------------------------------------------------------------------------
  const CSS = `
  .mb-promo-overlay {
    position: fixed;
    inset: 0;
    background: rgba(27, 59, 43, 0.55);
    backdrop-filter: blur(3px);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .mb-promo-overlay.mb-visible { opacity: 1; }

  .mb-promo-card {
    position: relative;
    width: 100%;
    max-width: 460px;
    background: #FAF9F6;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(27, 59, 43, 0.35);
    transform: translateY(18px) scale(0.97);
    transition: transform 0.35s cubic-bezier(.2,.8,.2,1);
    font-family: 'Inter', sans-serif;
  }
  .mb-promo-overlay.mb-visible .mb-promo-card {
    transform: translateY(0) scale(1);
  }

  .mb-promo-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(27, 59, 43, 0.08);
    border: none;
    color: #1B3B2B;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: background 0.2s ease;
  }
  .mb-promo-close:hover { background: rgba(27, 59, 43, 0.18); }

  .mb-promo-top {
    position: relative;
    height: 230px;
    background-color: #1B3B2B;
    background-size: cover;
    background-position: center;
  }

  .mb-promo-top-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(27,59,43,0.30) 0%, rgba(20,42,31,0.82) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 26px;
    text-align: center;
  }

  .mb-promo-rule {
    width: 34px;
    height: 1px;
    background: #B38B31;
    margin-bottom: 14px;
  }

  .mb-promo-headline {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400;
    font-size: 32px;
    line-height: 1.25;
    margin: 0;
    color: #FAF9F6;
    letter-spacing: 0.5px;
  }

  .mb-promo-body {
    padding: 24px 28px 28px;
  }

  .mb-promo-field {
    margin-bottom: 14px;
  }
  .mb-promo-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #8C4B33;
    margin-bottom: 5px;
  }
  .mb-promo-field input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1.5px solid rgba(27, 59, 43, 0.18);
    background: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    color: #1B3B2B;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .mb-promo-field input:focus {
    border-color: #1B3B2B;
  }

  .mb-promo-submit {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 10px;
    background: #1B3B2B;
    color: #FAF9F6;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }
  .mb-promo-submit:hover { background: #23503b; }
  .mb-promo-submit:active { transform: scale(0.98); }
  .mb-promo-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .mb-promo-msg {
    font-size: 13px;
    text-align: center;
    margin-top: 10px;
    min-height: 16px;
  }
  .mb-promo-msg.mb-error { color: #b3261e; }
  .mb-promo-msg.mb-ok { color: #1B3B2B; font-weight: 600; }

  .mb-promo-success {
    text-align: center;
    padding: 10px 4px 4px;
  }
  .mb-promo-success .mb-promo-check {
    width: 52px; height: 52px; border-radius: 50%;
    background: #1B3B2B; color: #FAF9F6;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; margin: 0 auto 14px;
  }
  .mb-promo-success h3 {
    font-family: 'Poppins', sans-serif;
    color: #1B3B2B; margin: 0 0 6px; font-size: 18px;
  }
  .mb-promo-success p {
    font-size: 13.5px; color: rgba(27,59,43,0.75); line-height: 1.5; margin: 0;
  }

  @media (max-width: 420px) {
    .mb-promo-headline { font-size: 32px; }
    .mb-promo-body { padding: 20px 20px 24px; }
    .mb-promo-top { padding: 24px 20px 20px; }
  }
  `;

  // ------------------------------------------------------------------------
  // Marcado (HTML)
  // ------------------------------------------------------------------------
  const HTML = `
  <div class="mb-promo-overlay" id="mbPromoOverlay" role="dialog" aria-modal="true" aria-labelledby="mbPromoTitulo">
    <div class="mb-promo-card">
      <button class="mb-promo-close" id="mbPromoClose" aria-label="Cerrar">&times;</button>

      <div id="mbPromoContenido">
        <div class="mb-promo-top" id="mbPromoTop">
          <div class="mb-promo-top-overlay">
            <div class="mb-promo-rule" aria-hidden="true"></div>
            <p class="mb-promo-headline" id="mbPromoTitulo">-10% en tu primer pedido</p>
          </div>
        </div>

        <div class="mb-promo-body">
          <form id="mbPromoForm" novalidate>
            <div class="mb-promo-field">
              <label for="mbPromoNombre">Nombre</label>
              <input type="text" id="mbPromoNombre" name="nombre" placeholder="Tu nombre" autocomplete="name" required />
            </div>
            <div class="mb-promo-field">
              <label for="mbPromoEmail">Correo</label>
              <input type="email" id="mbPromoEmail" name="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" required />
            </div>
            <button type="submit" class="mb-promo-submit" id="mbPromoSubmit">Suscribirme</button>
            <p class="mb-promo-msg" id="mbPromoMsg"></p>
          </form>
        </div>
      </div>
    </div>
  </div>
  `;

  // ------------------------------------------------------------------------
  // Inicialización
  // ------------------------------------------------------------------------
  function init() {
    if (!debeMostrarse()) return;

    // Inyectar estilos una sola vez
    if (!document.getElementById("mbPromoStyles")) {
      const style = document.createElement("style");
      style.id = "mbPromoStyles";
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    // Cargar la tipografía serif (una sola vez) para el look editorial del titular
    if (!document.getElementById("mbPromoFont")) {
      const link = document.createElement("link");
      link.id = "mbPromoFont";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap";
      document.head.appendChild(link);
    }

    // Inyectar marcado
    const wrapper = document.createElement("div");
    wrapper.innerHTML = HTML;
    document.body.appendChild(wrapper.firstElementChild);

    // Aplicar la imagen de fondo configurada arriba en CONFIG.IMAGEN_FONDO_URL
    const topSection = document.getElementById("mbPromoTop");
    if (topSection && CONFIG.IMAGEN_FONDO_URL) {
      topSection.style.backgroundImage = `url("${CONFIG.IMAGEN_FONDO_URL}")`;
    }

    const overlay = document.getElementById("mbPromoOverlay");
    const btnClose = document.getElementById("mbPromoClose");
    const form = document.getElementById("mbPromoForm");
    const btnSubmit = document.getElementById("mbPromoSubmit");
    const msg = document.getElementById("mbPromoMsg");
    const contenido = document.getElementById("mbPromoContenido");

    setTimeout(() => overlay.classList.add("mb-visible"), CONFIG.RETRASO_MS);

    function cerrar() {
      overlay.classList.remove("mb-visible");
      marcarCerrado();
      setTimeout(() => overlay.remove(), 350);
    }

    btnClose.addEventListener("click", cerrar);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cerrar();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "mb-promo-msg";
      msg.textContent = "";

      const nombre = document.getElementById("mbPromoNombre").value.trim();
      const email = document.getElementById("mbPromoEmail").value.trim();
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!nombre) {
        msg.textContent = "Por favor escribe tu nombre.";
        msg.classList.add("mb-error");
        return;
      }
      if (!emailValido) {
        msg.textContent = "Ese correo no se ve válido, revísalo.";
        msg.classList.add("mb-error");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "Enviando...";

      enviarRegistro({ nombre, email, origen: "promo_10", prefijoId: "PROMO" })
        .then(() => {
          marcarSuscrito();
          contenido.innerHTML = `
            <div class="mb-promo-success">
              <div class="mb-promo-check">✓</div>
              <h3>¡Listo, ${nombre.split(" ")[0]}!</h3>
              <p>Te llegará tu 10% de descuento al correo <strong>${email}</strong>
                 en los próximos minutos. Úsalo en tu primer pedido.</p>
            </div>
          `;
          setTimeout(cerrar, 4000);
        })
        .catch(() => {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Suscribirme";
          msg.textContent = "No se pudo enviar. Intenta de nuevo en un momento.";
          msg.classList.add("mb-error");
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
