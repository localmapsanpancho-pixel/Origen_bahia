const products = [
  {
    "id": 1,
    "name": "Lechuga orgánica",
    "category": "verduras",
    "producer": "Rancho El Pescador",
    "organic": "orgánico",
    "price": 42,
    "image": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 2,
    "name": "Tomate cherry",
    "category": "verduras",
    "producer": "Huerto Bahía",
    "organic": "orgánico",
    "price": 38,
    "image": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 3,
    "name": "Mango Ataulfo",
    "category": "frutas",
    "producer": "Huerto Bahía",
    "organic": "orgánico",
    "price": 56,
    "image": "https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 4,
    "name": "Plátano macho",
    "category": "frutas",
    "producer": "Rancho El Pescador",
    "organic": "no orgánico",
    "price": 28,
    "image": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 5,
    "name": "Queso fresco",
    "category": "lacteos",
    "producer": "Quesería El Valle",
    "organic": "no orgánico",
    "price": 120,
    "image": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 6,
    "name": "Yogur natural",
    "category": "lacteos",
    "producer": "Lácteos Nayarit",
    "organic": "orgánico",
    "price": 45,
    "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 7,
    "name": "Pan artesanal",
    "category": "artesanal",
    "producer": "Panadería de la Bahía",
    "organic": "no orgánico",
    "price": 35,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 8,
    "name": "Aceite de oliva",
    "category": "artesanal",
    "producer": "Molino del Bahía",
    "organic": "orgánico",
    "price": 180,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=400&fit=crop&q=80"
  },
  {
    "id": 100,
    "name": "Suscripción Básica — Canasta semanal",
    "category": "suscripcion",
    "producer": "Origen Bahía",
    "organic": "orgánico",
    "price": 299,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=80",
    "subscription": true,
    "plan_key": "basica"
  },
  {
    "id": 101,
    "name": "Suscripción Completa — Canasta semanal",
    "category": "suscripcion",
    "producer": "Origen Bahía",
    "organic": "orgánico",
    "price": 549,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=80",
    "subscription": true,
    "plan_key": "completa"
  },
  {
    "id": 102,
    "name": "Suscripción Premium — Canasta semanal",
    "category": "suscripcion",
    "producer": "Origen Bahía",
    "organic": "orgánico",
    "price": 899,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=80",
    "subscription": true,
    "plan_key": "premium"
  }
];

const cart = (() => {
  try { return JSON.parse(localStorage.getItem('ob_cart') || '{}'); }
  catch(e) { return {}; }
})();
const posTicket = {};
const SHIPPING_COST = 150;
const FREE_SHIPPING_THRESHOLD = 1000;
const MIN_PURCHASE = 300;

function persistCart() {
  try { localStorage.setItem('ob_cart', JSON.stringify(cart)); } catch(e) {}
}
function getCartBadgeCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
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

function renderProducts() {
  productGrid.innerHTML = '';
  const category = document.getElementById('categoryFilter').value;
  const organic = document.getElementById('organicFilter').value;
  const producer = document.getElementById('producerFilter').value;

  const filtered = products.filter((product) => {
    if (product.subscription) return false; // ocultar suscripciones del marketplace
    const matchesCategory = category === 'all' || product.category === category;
    const matchesOrganic = organic === 'all' || product.organic === organic;
    const matchesProducer = producer === 'all' || product.producer === producer;
    return matchesCategory && matchesOrganic && matchesProducer;
  });

  filtered.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
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
      <button class="button primary" style="width:100%;" onclick="addToCart(${product.id})">Agregar al carrito</button>
    `;

    productGrid.appendChild(card);
  });
}

function addToCart(productId) {
  if (!cart[productId]) cart[productId] = 0;
  cart[productId] += 1;
  updateCartDisplay();
  const product = products.find((item) => item.id === Number(productId));
  if (product) showToast(`Agregado: ${product.name}`);
}

function addToPos(productId) {
  if (!posTicket[productId]) posTicket[productId] = 0;
  posTicket[productId] += 1;
  updatePosDisplay();
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
    const product = products.find((item) => item.id === Number(id));
    if (!product) return;
    const itemTotal = product.price * qty;
    subtotal += itemTotal;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${product.name}</div>
        <div class="product-meta"><span>${product.producer}</span><span>${product.category}</span></div>
      </div>
      <div class="quantity-controls">
        <button onclick="changeQuantity(${id}, -1)">-</button>
        <span>${qty}</span>
        <button onclick="changeQuantity(${id}, 1)">+</button>
      </div>
      <div><strong>$${itemTotal.toFixed(2)}</strong></div>
    `;
    cartItems.appendChild(item);
  });

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  subtotalLabel.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingLabel) {
    shippingLabel.textContent = shipping === 0 ? '¡GRATIS!' : `$${shipping.toFixed(2)}`;
    shippingLabel.className = shipping === 0 ? 'shipping-free' : '';
  }
  totalLabel.textContent = `$${total.toFixed(2)}`;
}

function changeQuantity(productId, delta) {
  const current = cart[productId] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = next;
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
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Calcular subtotal
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    if (product) subtotal += product.price * qty;
  });

  if (!count) {
    orderMessage.textContent = 'Agrega al menos un producto antes de confirmar.';
    return;
  }
  if (subtotal < MIN_PURCHASE) {
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

  // Calcular envío y total
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  // Construir lista de productos con nombres legibles para el CMS
  const productos = Object.entries(cart).map(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
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

  // Enviar al servidor
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
    body: JSON.stringify({
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
      envio: shipping,
      total: total
    })
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
          total: total,
          paymentMethod: paymentMethod
        });
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
      } else {
        const errorMessage = data.error || 'Error desconocido en el servidor.';
        orderMessage.textContent = `Error: ${errorMessage}`;
      }
    })
    .catch(error => {
      orderMessage.textContent = `Error al enviar: ${error.message}`;
    });
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
  if (element) element.addEventListener('change', renderProducts);
});

if (productGrid) {
  // Poblar dinámicamente el filtro de productores (sólo productos visibles, sin suscripciones)
  const producerFilter = document.getElementById('producerFilter');
  if (producerFilter) {
    const existing = new Set(Array.from(producerFilter.options).map(o => o.value));
    [...new Set(products.filter(p => !p.subscription).map(p => p.producer))].sort().forEach((name) => {
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
  // Auto-suscripción desde el hero: si la URL trae ?plan=basica|completa|premium
  handleSubscriptionParam();
} else if (cartCount) {
  updateCartDisplay();
}
startCounterAnimation();

function handleSubscriptionParam() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  if (!plan) return;
  const sub = products.find(p => p.subscription && p.plan_key === plan);
  if (!sub) return;
  // Agregar al carrito una sola vez (no duplicar si recargan)
  cart[sub.id] = 1;
  persistCart();
  updateCartDisplay();
  // Mensaje + scroll al checkout
  if (orderMessage) {
    orderMessage.textContent = `✓ Suscripción "${sub.name}" agregada al carrito. Completa tus datos para confirmar.`;
  }
  // Limpia el query param para no re-agregar al recargar
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, '', cleanUrl || 'marketplace.html');
  setTimeout(() => {
    const target = document.getElementById('pedidos');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 400);
}

// Exponer funciones globalmente para compatibilidad con el HTML
try {
  window.renderProducts = renderProducts;
  window.addToCart = addToCart;
  window.addToPos = addToPos;
  window.changeQuantity = changeQuantity;
  window.submitOrder = submitOrder;
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
