const fs = require('fs');
const path = require('path');

// ==================== CONFIGURACIÓN ====================
const PRODUCTOS_PATH = path.join(__dirname, 'productos-manual.json');
const OUTPUT_FILE = path.join(__dirname, 'script.js');

// ==================== CARGAR PRODUCTOS MANUALES ====================
function cargarProductos() {
  try {
    if (!fs.existsSync(PRODUCTOS_PATH)) {
      console.error('❌ Error: No se encontró productos-manual.json');
      console.log('\n📝 Crea el archivo con esta estructura:\n');
      const ejemplo = [
        {
          "id": 1,
          "name": "Lechuga orgánica",
          "category": "verduras",
          "producer": "Rancho El Pescador",
          "organic": "orgánico",
          "price": 42
        },
        {
          "id": 2,
          "name": "Tomate cherry",
          "category": "verduras",
          "producer": "Huerto Bahía",
          "organic": "orgánico",
          "price": 38
        }
      ];
      console.log(JSON.stringify(ejemplo, null, 2));
      process.exit(1);
    }

    const contenido = fs.readFileSync(PRODUCTOS_PATH, 'utf-8');
    const productos = JSON.parse(contenido);

    if (!Array.isArray(productos)) {
      throw new Error('El archivo debe contener un array de productos');
    }

    // Validar estructura
    productos.forEach((p, idx) => {
      if (!p.id || !p.name || !p.category || !p.producer || p.price === undefined) {
        throw new Error(
          `Producto ${idx + 1} incompleto. Requiere: id, name, category, producer, organic, price`
        );
      }
    });

    console.log(`✅ Se cargaron ${productos.length} productos`);
    return productos;

  } catch (error) {
    console.error('❌ Error cargando productos:', error.message);
    process.exit(1);
  }
}

// ==================== GENERAR SCRIPT.JS ====================
function generarScriptJS(productos) {
  const productosJSON = JSON.stringify(productos, null, 2);

  return `const products = ${productosJSON};

const cart = {};
const posTicket = {};
const shippingCost = 49;

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
    const matchesCategory = category === 'all' || product.category === category;
    const matchesOrganic = organic === 'all' || product.organic === organic;
    const matchesProducer = producer === 'all' || product.producer === producer;
    return matchesCategory && matchesOrganic && matchesProducer;
  });

  filtered.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = \`
      <h4>\${product.name}</h4>
      <div class="product-meta">
        <span>\${product.category}</span>
        <span>\${product.organic}</span>
        <span>\${product.producer}</span>
      </div>
      <p class="price">$\${product.price.toFixed(2)}</p>
      <button class="button secondary" onclick="addToCart(\${product.id})">Agregar al carrito</button>
      <button class="button" style="margin-top:0.75rem;" onclick="addToPos(\${product.id})">Agregar a POS</button>
    \`;

    productGrid.appendChild(card);
  });
}

function addToCart(productId) {
  if (!cart[productId]) cart[productId] = 0;
  cart[productId] += 1;
  updateCartDisplay();
}

function addToPos(productId) {
  if (!posTicket[productId]) posTicket[productId] = 0;
  posTicket[productId] += 1;
  updatePosDisplay();
}

function updateCartDisplay() {
  cartItems.innerHTML = '';
  const entries = Object.entries(cart);
  let subtotal = 0;

  if (!entries.length) {
    cartItems.innerHTML = '<p>El carrito está vacío. Añade productos desde el market place.</p>';
  }

  entries.forEach(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    const itemTotal = product.price * qty;
    subtotal += itemTotal;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = \`
      <div>
        <div class="item-title">\${product.name}</div>
        <div class="product-meta"><span>\${product.producer}</span><span>\${product.category}</span></div>
      </div>
      <div class="quantity-controls">
        <button onclick="changeQuantity(\${id}, -1)">-</button>
        <span>\${qty}</span>
        <button onclick="changeQuantity(\${id}, 1)">+</button>
      </div>
      <div><strong>$\${itemTotal.toFixed(2)}</strong></div>
    \`;
    cartItems.appendChild(item);
  });

  const total = subtotal + shippingCost;
  cartCount.textContent = entries.reduce((sum, [, qty]) => sum + qty, 0);
  subtotalLabel.textContent = \`$\${subtotal.toFixed(2)}\`;
  shippingLabel.textContent = \`$\${shippingCost.toFixed(2)}\`;
  totalLabel.textContent = \`$\${total.toFixed(2)}\`;
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
  const address = document.getElementById('customerAddress').value.trim();
  const time = document.getElementById('deliveryTime').value.trim();
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (!count) {
    orderMessage.textContent = 'Agrega al menos un producto antes de confirmar.';
    return;
  }
  if (!name || !address || !time) {
    orderMessage.textContent = 'Completa todos los datos de entrega para enviar el pedido.';
    return;
  }

  orderMessage.textContent = \`Pedido registrado. Gracias, \${name}! Entrega programada para \${time}.\`;
  Object.keys(cart).forEach((key) => delete cart[key]);
  updateCartDisplay();
}

function updatePosDisplay() {
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
    item.innerHTML = \`
      <div>
        <div class="item-title">\${product.name}</div>
        <div class="product-meta"><span>\${qty} unidad(es)</span></div>
      </div>
      <div><strong>$\${itemTotal.toFixed(2)}</strong></div>
    \`;
    posItems.appendChild(item);
  });

  posTotalLabel.textContent = \`$\${total.toFixed(2)}\`;
}

function checkoutPOS(method) {
  const count = Object.values(posTicket).reduce((sum, qty) => sum + qty, 0);
  if (!count) {
    posMessage.textContent = 'Agrega productos antes de cerrar el cobro.';
    return;
  }
  posMessage.textContent = \`Ticket cerrado con \${method}. Total: \${posTotalLabel.textContent}.\`;
  Object.keys(posTicket).forEach((key) => delete posTicket[key]);
  updatePosDisplay();
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
function animateCounter(element, target, duration = 2000) {
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

// Filtros y inicializacion
['categoryFilter', 'organicFilter', 'producerFilter'].forEach((id) => {
  const element = document.getElementById(id);
  if (element) element.addEventListener('change', renderProducts);
});

renderProducts();
updateCartDisplay();
updatePosDisplay();
startCounterAnimation();
`;
}

// ==================== GUARDAR ARCHIVO ====================
function guardarArchivo(content) {
  try {
    fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
    console.log(`✅ Archivo guardado: ${OUTPUT_FILE}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando archivo:', error.message);
    return false;
  }
}

// ==================== FUNCIÓN PRINCIPAL ====================
function sincronizar() {
  console.log('\n🔄 Sincronizando productos desde productos-manual.json...\n');

  const productos = cargarProductos();

  if (productos.length === 0) {
    console.warn('⚠️  No hay productos para sincronizar');
    return;
  }

  const scriptJS = generarScriptJS(productos);
  const guardado = guardarArchivo(scriptJS);

  if (guardado) {
    console.log('\n✨ Sincronización manual completada exitosamente\n');
    console.log('📊 Resumen:');
    console.log(`   - Productos: ${productos.length}`);
    console.log(`   - Archivo: script.js`);
    console.log(`   - Timestamp: ${new Date().toLocaleString('es-ES')}`);
    console.log('\n💡 Tip: Edita productos-manual.json y ejecuta "npm run sync:manual" nuevamente\n');
  }
}

// ==================== EJECUTAR ====================
if (require.main === module) {
  sincronizar().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { sincronizar, cargarProductos, generarScriptJS };
