const products = [];

const cart = (() => {
  try { return JSON.parse(localStorage.getItem('ob_cart') || '{}'); }
  catch(e) { return {}; }
})();
window.__obCart = cart;
const posTicket = {};
const FREE_SHIPPING_THRESHOLD = 1500;
const MIN_PURCHASE = 800;
const FREE_SHIPPING_PRODUCT_ID = 'test_01';
const SHIPPING_RATES = {
  '63729': { 'San Pancho': 50, 'Lo de Marcos': 80 },
  '63734': { 'Sayulita': 100, 'La Cruz de Huanacaxtle': 120, 'Punta de Mita': 150 },
  '63732': { 'Bucerías': 150 },
  '63735': { 'Mezcales': 200, 'Nuevo Nayarit': 250 },
  '63720': { 'Guayabitos': 150, 'La Peñita de Jaltemba': 200 }
};

function persistCart() {
  const cartState = window.__obCart || cart;
  try { localStorage.setItem('ob_cart', JSON.stringify(cartState)); } catch(e) {}
}
function getCartBadgeCount() {
  const cartState = window.__obCart || cart;
  return Object.values(cartState).reduce((sum, qty) => sum + qty, 0);
}

function cartHasProduct(productId) {
  const targetId = String(productId || '').trim().toLowerCase();
  const aliases = new Set([targetId, `ob_${targetId}`, `ob_${targetId.replace(/_/g, '-')}`]);

  return Object.keys(cart).some((id) => {
    const normalizedId = String(id || '').trim().toLowerCase();
    if (aliases.has(normalizedId)) return true;

    const product = getProductById(id);
    if (!product) return false;

    const productName = String(product.name || '').trim().toLowerCase();
    const productSlug = productName.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return productName === targetId || productSlug === targetId || `ob_${productSlug}` === targetId;
  });
}

// === Toast: notificación tipo "agregado al carrito" ===
function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'error' ? '⚠' : '✓'}</span><span>${message}</span>`;
  container.appendChild(toast);
  // Trigger entrance
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 350);
  }, 2400);
}

// === Modal de confirmación de pedido ===
function showOrderModal({ id, total, paymentMethod }) {
  const modal = document.getElementById('orderConfirmModal');
  if (!modal) return;
  document.getElementById('orderConfirmId').textContent = `#${id}`;
  document.getElementById('orderConfirmTotal').textContent = `$${Number(total).toFixed(2)}`;
  document.getElementById('orderConfirmPayment').textContent = paymentMethod || '—';

  const msgEl = document.getElementById('orderModalMsg');
  if (msgEl) {
    if (paymentMethod === 'Tarjeta (Stripe)') {
      msgEl.innerHTML = 'Tu pago se procesó correctamente.<br>Te contactaremos por WhatsApp para coordinar la entrega.<br>¡Gracias por apoyar lo local!';
    } else {
      msgEl.innerHTML = 'Te contactaremos por WhatsApp para confirmar la entrega.<br>Favor de responder en las prox. 24 hrs. o llamar al +52 322 380 9440<br>¡Gracias por apoyar lo local!';
    }
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeOrderModal() {
  const modal = document.getElementById('orderConfirmModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
window.closeOrderModal = closeOrderModal;
window.showToast = showToast;

const productGrid = document.getElementById('productGrid');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const subtotalLabel = document.getElementById('subtotal');
const totalLabel = document.getElementById('total');
const shippingLabel = document.getElementById('shipping');
const orderMessage = document.getElementById('orderMessage');
const posItems = document.getElementById('posItems');
const posTotalLabel = document.getElementById('posTotal');
const posMessage = document.getElementById('posMessage');
const postalCodeEl = document.getElementById('postalCode');
const localityEl = document.getElementById('shippingLocality');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');

if (postalCodeEl) postalCodeEl.addEventListener('input', updateCartDisplay);
if (localityEl) localityEl.addEventListener('change', updateCartDisplay);

// Cambia el texto del botón según el método de pago elegido:
// Efectivo -> "Confirmar pedido", Tarjeta -> "Pagar con tarjeta"
function updateConfirmButtonLabel() {
  if (!confirmOrderBtn) return;
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  const method = selected ? selected.value : 'Efectivo';
  confirmOrderBtn.classList.remove('success', 'danger');
  confirmOrderBtn.classList.add('primary');
  confirmOrderBtn.textContent = method === 'Tarjeta (Stripe)' ? '💳 Pagar con tarjeta' : '✓ Confirmar pedido';
}
document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
  input.addEventListener('change', updateConfirmButtonLabel);
});
updateConfirmButtonLabel();

function getProductById(productId) {
  const normalizedId = String(productId);
  const fromMainProducts = products.find((item) => String(item.id) === normalizedId);
  if (fromMainProducts) return fromMainProducts;

  if (Array.isArray(window.obProductsRef)) {
    return window.obProductsRef.find((item) => String(item.id) === normalizedId) || null;
  }

  return null;
}

function resolveSpecialProduct(type, key) {
  const normalizedKey = String(key || '').toLowerCase();
  const fromMainProducts = products.find((item) => {
    if (type === 'plan') return Boolean(item.subscription && item.plan_key === normalizedKey);
    return Boolean(item.basket && item.basket_key === normalizedKey);
  });
  if (fromMainProducts) return fromMainProducts;

  if (Array.isArray(window.obProductsRef)) {
    const fromRef = window.obProductsRef.find((item) => {
      if (type === 'plan') return Boolean(item.subscription && item.plan_key === normalizedKey);
      return Boolean(item.basket && item.basket_key === normalizedKey);
    });
    if (fromRef) return fromRef;
  }

  const fallback = {
    id: `special_${type}_${normalizedKey}`,
    name: type === 'plan'
      ? (normalizedKey === 'basica' ? 'Suscripción Básica' : normalizedKey === 'completa' ? 'Suscripción Completa' : normalizedKey === 'premium' ? 'Suscripción Premium' : 'Suscripción')
      : (normalizedKey === 'verde' ? 'Canasta Verde' : normalizedKey === 'premium' ? 'Canasta Premium' : 'Canasta'),
    category: type === 'plan' ? 'suscripciones' : 'canastas',
    producer: 'Origen Bahía',
    organic: 'orgánico',
    price: type === 'plan'
      ? (normalizedKey === 'basica' ? 299 : normalizedKey === 'completa' ? 549 : normalizedKey === 'premium' ? 899 : 0)
      : (normalizedKey === 'premium' ? 999 : 799),
    image: '',
    subscription: type === 'plan',
    basket: type !== 'plan',
    plan_key: normalizedKey,
    basket_key: normalizedKey
  };

  if (!products.some((item) => String(item.id) === String(fallback.id))) {
    products.push(fallback);
  }

  return fallback;
}

function normalizeFilterValue(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getFilterValues() {
  return {
    category: normalizeFilterValue(document.getElementById('categoryFilter')?.value || 'all'),
    organic: normalizeFilterValue(document.getElementById('organicFilter')?.value || 'all'),
    producer: normalizeFilterValue(document.getElementById('producerFilter')?.value || 'all')
  };
}

function applyMarketplaceFilters() {
  const catalogGrid = document.getElementById('productos-grid');
  const targetGrid = catalogGrid || productGrid;
  if (!targetGrid) return false;

  const { category, organic, producer } = getFilterValues();
  const cards = targetGrid.querySelectorAll('.product-card, .prod-card');
  let visibleCount = 0;

  cards.forEach((card) => {
    const cardCategory = normalizeFilterValue(card.dataset.category || '');
    const cardOrganic = normalizeFilterValue(card.dataset.organic || '');
    const cardProducer = normalizeFilterValue(card.dataset.producer || '');

    const matchesCategory = category === 'all' || cardCategory === category;
    const matchesOrganic = organic === 'all' || cardOrganic === organic;
    const matchesProducer = producer === 'all' || cardProducer === producer;
    const isVisible = matchesCategory && matchesOrganic && matchesProducer;

    card.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount += 1;
  });

  return visibleCount > 0;
}

function renderProducts() {
  const catalogGrid = document.getElementById('productos-grid');
  if (catalogGrid) {
    applyMarketplaceFilters();
    return;
  }

  productGrid.innerHTML = '';
  const { category, organic, producer } = getFilterValues();

  const filtered = products.filter((product) => {
    if (product.subscription) return false; // ocultar suscripciones del marketplace
    if (product.basket) return false; // ocultar canastas del marketplace
    const matchesCategory = category === 'all' || product.category === category;
    const matchesOrganic = organic === 'all' || product.organic === organic;
    const matchesProducer = producer === 'all' || product.producer === producer;
    return matchesCategory && matchesOrganic && matchesProducer;
  });

  filtered.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = (product.category || '').toLowerCase();
    card.dataset.organic = (product.organic || '').toLowerCase();
    card.dataset.producer = (product.producer || '').toLowerCase();
    const safeProductId = String(product.id).replace(/'/g, "\\'");
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'" />
      </div>
      <h4>${product.name}</h4>
      <div class="product-meta">
        <span>${product.category}</span>
        <span>${product.organic}</span>
        <span>${product.producer}</span>
      </div>
      <p class="price">$${product.price.toFixed(2)}</p>
      <button class="button primary" style="width:100%;" onclick="addToCart('${safeProductId}')">Agregar al carrito</button>
    `;

    productGrid.appendChild(card);
  });
}

function addToCart(productId) {
  const normalizedId = String(productId);
  if (!cart[normalizedId]) cart[normalizedId] = 0;
  cart[normalizedId] += 1;
  updateCartDisplay();
  const product = getProductById(productId);
  if (product) showToast(`Agregado: ${product.name}`);
}

function addToPos(productId) {
  if (!posTicket[productId]) posTicket[productId] = 0;
  posTicket[productId] += 1;
  updatePosDisplay();
}

function getShippingCost(subtotal) {
  const postalCode = (postalCodeEl?.value || '').trim();
  const locality = (localityEl?.value || '').trim();
  const ratesForPostalCode = postalCode ? SHIPPING_RATES[postalCode] : null;
  const selectedRate = ratesForPostalCode && locality ? ratesForPostalCode[locality] : null;
  const hasBasketInCart = Object.keys(cart).some((id) => {
    const product = getProductById(id);
    return product && String(product.category || '').toLowerCase() === 'canasta';
  });

  if (cartHasProduct(FREE_SHIPPING_PRODUCT_ID)) return 0;

  if (hasBasketInCart) {
    if (selectedRate != null) return selectedRate;
    return null;
  }

  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (selectedRate != null) return selectedRate;
  return null;
}

function updateCartDisplay() {
  // Siempre actualizar el badge del menú (existe en ambas páginas)
  const badgeCount = getCartBadgeCount();
  if (cartCount) {
    cartCount.textContent = badgeCount;
    cartCount.classList.toggle('has-items', badgeCount > 0);
  }
  persistCart();

  // Si no estamos en marketplace, solo actualizamos el badge y salimos
  if (!cartItems) return;

  cartItems.innerHTML = '';
  const entries = Object.entries(cart);
  let subtotal = 0;

  if (!entries.length) {
    cartItems.innerHTML = '<p>El carrito está vacío. Añade productos desde el market place.</p>';
  }

  entries.forEach(([id, qty]) => {
    const product = getProductById(id);
    if (!product) return;
    const itemTotal = product.price * qty;
    subtotal += itemTotal;
    const safeCartId = String(id).replace(/'/g, "\\'");

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${product.name}</div>
        <div class="product-meta"><span>${product.producer}</span><span>${product.category}</span></div>
      </div>
      <div class="quantity-controls">
        <button type="button" onclick="window.changeQuantity('${safeCartId}', -1)">-</button>
        <span>${qty}</span>
        <button type="button" onclick="window.changeQuantity('${safeCartId}', 1)">+</button>
      </div>
      <div><strong>$${itemTotal.toFixed(2)}</strong></div>
    `;
    cartItems.appendChild(item);
  });

  const shipping = getShippingCost(subtotal);
  const total = subtotal + (shipping || 0);
  subtotalLabel.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingLabel) {
    shippingLabel.textContent = shipping == null ? '—' : shipping === 0 ? '¡GRATIS!' : `$${shipping.toFixed(2)}`;
    shippingLabel.className = shipping === 0 ? 'shipping-free' : '';
  }
  totalLabel.textContent = `$${total.toFixed(2)}`;
}

function changeQuantity(productId, delta) {
  const normalizedId = String(productId);
  const current = cart[normalizedId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete cart[normalizedId];
  } else {
    cart[normalizedId] = next;
  }
  updateCartDisplay();
}

function submitOrder() {
  const name = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const time = document.getElementById('deliveryTime').value.trim();
  const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentRadio ? paymentRadio.value : 'Efectivo';
  const termsAccepted = document.getElementById('acceptTerms')?.checked;
  const postalCode = (postalCodeEl?.value || '').trim();
  const locality = (localityEl?.value || '').trim();
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const hasFreeShippingProduct = cartHasProduct(FREE_SHIPPING_PRODUCT_ID);

  // Calcular subtotal
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const product = getProductById(id);
    if (product) subtotal += product.price * qty;
  });

  if (!count) {
    orderMessage.textContent = 'Agrega al menos un producto antes de confirmar.';
    return;
  }
  if (subtotal < MIN_PURCHASE && !hasFreeShippingProduct) {
    orderMessage.textContent = `La compra mínima es de $${MIN_PURCHASE}. Te faltan $${(MIN_PURCHASE - subtotal).toFixed(2)} para completar el pedido.`;
    return;
  }
  if (!termsAccepted) {
    orderMessage.textContent = 'Debes aceptar los términos y condiciones para continuar.';
    return;
  }
  if (!name || !email || !phone || !address || !time) {
    orderMessage.textContent = 'Completa todos los datos de entrega para enviar el pedido.';
    return;
  }

  // Requerir CP/localidad solo para canastas (no suscripciones), igual que valida el backend
  const isSubscription = Object.keys(cart).some((id) => {
    const p = getProductById(id);
    return p && p.category === 'Suscripción';
  });
  if (!isSubscription && !hasFreeShippingProduct && (!postalCode || !locality)) {
    orderMessage.textContent = 'Ingresa tu código postal y selecciona la localidad para calcular el envío.';
    return;
  }

  // Calcular envío y total
  const shipping = getShippingCost(subtotal);
  const total = subtotal + (shipping || 0);

  // Construir lista de productos con nombres legibles para el CMS
  const productos = Object.entries(cart).map(([id, qty]) => {
    const product = getProductById(id);
    return {
      id: Number(id),
      nombre: product ? product.name : 'Producto desconocido',
      productor: product ? product.producer : '',
      categoria: product ? product.category : '',
      cantidad: qty,
      precio_unitario: product ? product.price : 0,
      subtotal_producto: product ? product.price * qty : 0
    };
  });

  // Resumen legible para mostrar en correos/dashboard
  const resumen_productos = productos
    .map(p => `${p.cantidad}x ${p.nombre} ($${p.precio_unitario.toFixed(2)} c/u)`)
    .join(' | ');

  const orderData = {
    nombre: name,
    email: email,
    telefono: phone,
    direccion: address,
    hora: time,
    metodo_pago: paymentMethod,
    cart: cart,
    productos: productos,
    resumen_productos: resumen_productos,
    subtotal: subtotal,
    codigo_postal: postalCode,
    localidad: locality,
    envio: shipping,
    total: total
  };

  if (paymentMethod === 'Tarjeta (Stripe)') {
    payWithStripe(orderData);
    return;
  }

  submitOrderDirect(orderData);
}

// Pago en efectivo: se guarda el pedido de inmediato en el backend.
function submitOrderDirect(orderData) {
  orderMessage.textContent = 'Enviando pedido...';

  const LOCAL_BACKEND_URL = 'http://localhost:3000';
  const REMOTE_BACKEND_URL = window.BACKEND_URL || null;

  if (window.location.hostname !== 'localhost' && !REMOTE_BACKEND_URL) {
    orderMessage.textContent = 'Error: backend remoto no configurado. Ajusta window.BACKEND_URL en marketplace.html.';
    return;
  }

  const serverUrl = window.location.hostname === 'localhost'
    ? `${LOCAL_BACKEND_URL}/submit_order`
    : `${REMOTE_BACKEND_URL}/submit_order`;

  fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
    .then(async (res) => {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return { status: res.status, data };
      } catch (parseError) {
        throw new Error(`Respuesta inválida del servidor: ${parseError.message}. Detalles: ${text.slice(0, 200)}`);
      }
    })
    .then(({ status, data }) => {
      if (status >= 200 && status < 300 && data.success) {
        orderMessage.textContent = '';
        // Mostrar modal de confirmación
        showOrderModal({
          id: data.pedidoId || '—',
          total: orderData.total,
          paymentMethod: orderData.metodo_pago
        });
        limpiarCarritoYFormulario();
      } else {
        const errorMessage = data.error || 'Error desconocido en el servidor.';
        orderMessage.textContent = `Error: ${errorMessage}`;
      }
    })
    .catch(error => {
      orderMessage.textContent = `Error al enviar: ${error.message}`;
    });
}

// Pago con tarjeta: creamos la sesión de Stripe y redirigimos.
// El pedido se guarda del lado del backend solo cuando Stripe confirma el pago (webhook).
function payWithStripe(orderData) {
  orderMessage.textContent = 'Redirigiendo a pago seguro...';
  if (confirmOrderBtn) {
    confirmOrderBtn.textContent = 'Redirigiendo...';
    confirmOrderBtn.classList.remove('success', 'danger');
    confirmOrderBtn.classList.add('primary');
  }

  // Guardamos el pedido localmente para poder mostrar el total al volver de Stripe
  try { localStorage.setItem('ob_pedido_en_curso', JSON.stringify(orderData)); } catch (e) {}

  const LOCAL_BACKEND_URL = 'http://localhost:3000';
  const REMOTE_BACKEND_URL = window.BACKEND_URL || null;

  if (window.location.hostname !== 'localhost' && !REMOTE_BACKEND_URL) {
    orderMessage.textContent = 'Error: backend remoto no configurado. Ajusta window.BACKEND_URL en marketplace.html.';
    return;
  }

  const serverUrl = window.location.hostname === 'localhost'
    ? `${LOCAL_BACKEND_URL}/create-checkout-session`
    : `${REMOTE_BACKEND_URL}/create-checkout-session`;

  fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
    .then(async (res) => {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return { status: res.status, data };
      } catch (parseError) {
        throw new Error(`Respuesta inválida del servidor: ${parseError.message}. Detalles: ${text.slice(0, 200)}`);
      }
    })
    .then(({ status, data }) => {
      if (status >= 200 && status < 300 && data.url) {
        window.location.href = data.url;
      } else {
        const errorMessage = data.error || 'No se pudo iniciar el pago.';
        orderMessage.textContent = `Error: ${errorMessage}`;
        updateConfirmButtonLabel();
      }
    })
    .catch(error => {
      orderMessage.textContent = `Error al iniciar el pago: ${error.message}`;
      updateConfirmButtonLabel();
    });
}

function limpiarCarritoYFormulario() {
  Object.keys(cart).forEach((key) => delete cart[key]);
  persistCart();
  updateCartDisplay();
  document.getElementById('customerName').value = '';
  document.getElementById('customerEmail').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerAddress').value = '';
  document.getElementById('deliveryTime').value = '';
  const terms = document.getElementById('acceptTerms');
  if (terms) terms.checked = false;
  try { localStorage.removeItem('ob_pedido_en_curso'); } catch (e) {}
}

// Al volver de Stripe (éxito o cancelación) mostramos el resultado correspondiente.
function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const stripeStatus = params.get('stripe');
  const sessionId = params.get('session_id');
  if (!stripeStatus) return;

  // Limpiamos la URL de una vez para que no se repita el flujo al recargar
  params.delete('stripe');
  params.delete('session_id');
  const query = params.toString();
  const newUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
  window.history.replaceState({}, '', newUrl);

  if (stripeStatus === 'cancelado') {
    if (orderMessage) orderMessage.textContent = 'Pago cancelado. Tu carrito sigue guardado, puedes intentar de nuevo.';
    return;
  }

  if (stripeStatus !== 'success') return;

  let orderData = null;
  try { orderData = JSON.parse(localStorage.getItem('ob_pedido_en_curso') || 'null'); } catch (e) {}

  if (orderMessage) orderMessage.textContent = 'Confirmando tu pago...';

  if (!sessionId) {
    // No deberíamos llegar aquí, pero por si acaso mostramos lo que tengamos localmente
    showOrderModal({ id: '—', total: orderData ? orderData.total : 0, paymentMethod: 'Tarjeta (Stripe)' });
    limpiarCarritoYFormulario();
    return;
  }

  const LOCAL_BACKEND_URL = 'http://localhost:3000';
  const REMOTE_BACKEND_URL = window.BACKEND_URL || null;
  const backendBase = window.location.hostname === 'localhost' ? LOCAL_BACKEND_URL : REMOTE_BACKEND_URL;

  // El webhook de Stripe puede tardar unos segundos en procesar el pedido,
  // así que reintentamos varias veces antes de rendirnos.
  let intentos = 0;
  const MAX_INTENTOS = 8;

  function consultarPedido() {
    intentos++;
    fetch(`${backendBase}/order-status/${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'confirmado') {
          showOrderModal({
            id: data.pedidoId,
            total: data.total != null ? data.total : (orderData ? orderData.total : 0),
            paymentMethod: data.metodoPago || 'Tarjeta (Stripe)'
          });
          if (orderMessage) orderMessage.textContent = '✓ Pago confirmado. ¡Gracias por tu pedido!';
          limpiarCarritoYFormulario();
        } else if (intentos < MAX_INTENTOS) {
          setTimeout(consultarPedido, 1500);
        } else {
          // Se agotaron los reintentos: mostramos lo que tengamos en local
          // y avisamos que la confirmación puede tardar un poco más.
          showOrderModal({ id: '—', total: orderData ? orderData.total : 0, paymentMethod: 'Tarjeta (Stripe)' });
          if (orderMessage) orderMessage.textContent = '✓ Pago recibido. Tu número de pedido llegará por correo en unos minutos.';
          limpiarCarritoYFormulario();
        }
      })
      .catch(() => {
        if (intentos < MAX_INTENTOS) {
          setTimeout(consultarPedido, 1500);
        } else {
          showOrderModal({ id: '—', total: orderData ? orderData.total : 0, paymentMethod: 'Tarjeta (Stripe)' });
          if (orderMessage) orderMessage.textContent = '✓ Pago recibido. Tu número de pedido llegará por correo en unos minutos.';
          limpiarCarritoYFormulario();
        }
      });
  }

  consultarPedido();
}

function updatePosDisplay() {
  if (!posItems) return;
  posItems.innerHTML = '';
  const entries = Object.entries(posTicket);
  let total = 0;

  if (!entries.length) {
    posItems.innerHTML = '<p>El ticket está vacío. Agrega productos desde el market place.</p>';
  }

  entries.forEach(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    const itemTotal = product.price * qty;
    total += itemTotal;

    const item = document.createElement('div');
    item.className = 'pos-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${product.name}</div>
        <div class="product-meta"><span>${qty} unidad(es)</span></div>
      </div>
      <div><strong>$${itemTotal.toFixed(2)}</strong></div>
    `;
    posItems.appendChild(item);
  });

  if (posTotalLabel) posTotalLabel.textContent = `$${total.toFixed(2)}`;
}

function checkoutPOS(method) {
  const count = Object.values(posTicket).reduce((sum, qty) => sum + qty, 0);
  const phone = document.getElementById('posPhone')?.value.trim();
  if (!count) {
    posMessage.textContent = 'Agrega productos antes de cerrar el cobro.';
    return;
  }
  if (!phone) {
    posMessage.textContent = 'Ingresa el teléfono o WhatsApp del cliente para el cobro.';
    return;
  }
  posMessage.textContent = `Ticket cerrado con ${method}. Total: ${posTotalLabel.textContent}.`; 
  Object.keys(posTicket).forEach((key) => delete posTicket[key]);
  updatePosDisplay();
}

async function payWithMercadoPago() {
  const items = Object.entries(posTicket).map(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    return {
      title: product.name,
      quantity: qty,
      unit_price: product.price,
      currency_id: 'MXN',
      description: `${product.category} - ${product.producer}`,
      picture_url: '',
    };
  });

  if (!items.length) {
    posMessage.textContent = 'Agrega productos al ticket antes de pagar con Mercado Pago.';
    return;
  }

  const payer = {
    name: document.getElementById('customerName')?.value || 'Cliente',
    email: 'cliente@correo.com',
    phone: {
      area_code: '',
      number: document.getElementById('posPhone')?.value.trim() || document.getElementById('customerPhone')?.value.trim() || '',
    },
  };

  try {
    const response = await fetch('/create_preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items, payer }),
    });

    const data = await response.json();
    if (!response.ok || !data.init_point) {
      throw new Error(data.error || 'No se pudo crear la preferencia de pago.');
    }

    window.location.href = data.init_point;
  } catch (error) {
    posMessage.textContent = `Error al iniciar pago: ${error.message}`;
  }
}

function scrollToCart() {
  document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });
}

// Menu responsivo
const hamburger = document.getElementById('menuToggle');
const topNav = document.getElementById('topNav');

if (hamburger && topNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    topNav.classList.toggle('active');
  });

  topNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      topNav.classList.remove('active');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      hamburger.classList.remove('active');
      topNav.classList.remove('active');
    }
  });
}

// Animacion de conteo
function animateCounter(element, target, duration = 3500) {
  let start = 0;
  const increment = target / (duration / 50);

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 50);
}

function startCounterAnimation() {
  const counters = document.querySelectorAll('.counter');
  let animationStarted = false;

  function checkVisibility() {
    if (!animationStarted && counters.length > 0) {
      const firstCounter = counters[0];
      const rect = firstCounter.getBoundingClientRect();
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-target'));
          animateCounter(counter, target);
        });
        animationStarted = true;
        window.removeEventListener('scroll', checkVisibility);
      }
    }
  }

  window.addEventListener('scroll', checkVisibility);
  checkVisibility();
}

// Filtros y inicializacion (solo en marketplace.html)
['categoryFilter', 'organicFilter', 'producerFilter'].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', () => {
      if (document.getElementById('productos-grid')) {
        applyMarketplaceFilters();
      } else {
        renderProducts();
      }
    });
  }
});

const applyFiltersBtn = document.getElementById('applyFiltersBtn');
if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    if (document.getElementById('productos-grid')) {
      applyMarketplaceFilters();
    } else {
      renderProducts();
    }
  });
}

if (productGrid) {
  // Poblar dinámicamente el filtro de productores (sólo productos visibles)
  const producerFilter = document.getElementById('producerFilter');
  if (producerFilter) {
    const existing = new Set(Array.from(producerFilter.options).map(o => o.value));
    [...new Set(products.filter(p => !p.subscription && !p.basket).map(p => p.producer))].sort().forEach((name) => {
      if (!existing.has(name)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        producerFilter.appendChild(opt);
      }
    });
  }
  renderProducts();
  updateCartDisplay();
  updatePosDisplay();
  // Auto-agregar: suscripción (?plan=) o canasta (?basket=)
  handleSpecialProductParam();
  // Si volvemos de Stripe (éxito/cancelación), mostrar el resultado correspondiente
  handleStripeReturn();
  updateConfirmButtonLabel();
} else if (cartCount) {
  updateCartDisplay();
}
startCounterAnimation();

function handleSpecialProductParam() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  const basket = params.get('basket');
  let target = null;

  if (plan) {
    target = resolveSpecialProduct('plan', plan);
  } else if (basket) {
    target = resolveSpecialProduct('basket', basket);
  }
  if (!target) return;

  cart[String(target.id)] = 1;
  persistCart();
  updateCartDisplay();
  if (orderMessage) {
    const tipo = target.subscription ? 'Suscripción' : 'Canasta';
    orderMessage.textContent = `✓ ${tipo} "${target.name}" agregada al carrito. Completa tus datos para confirmar.`;
  }
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, '', cleanUrl || 'marketplace.html');
  setTimeout(() => {
    const targetEl = document.getElementById('pedidos');
    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 400);
}

// Exponer funciones globalmente para compatibilidad con el HTML
try {
  window.renderProducts = renderProducts;
  window.applyMarketplaceFilters = applyMarketplaceFilters;
  window.addToCart = addToCart;
  window.addToPos = addToPos;
  window.changeQuantity = changeQuantity;
  window.submitOrder = submitOrder;
  window.payWithStripe = payWithStripe;
  window.checkoutPOS = checkoutPOS;
  window.payWithMercadoPago = payWithMercadoPago;
  window.scrollToCart = scrollToCart;
  window.updateCartDisplay = updateCartDisplay;
  window.updatePosDisplay = updatePosDisplay;
  window.startCounterAnimation = startCounterAnimation;
} catch (e) {
  // Ignorar si alguna función no está definida por algún motivo
  console.warn('No se pudieron exponer funciones globales:', e && e.message);
}

// deploy-marker: v7
