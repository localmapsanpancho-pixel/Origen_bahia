const products = [
  { id: 1, name: 'Lechuga orgánica', category: 'verduras', producer: 'Rancho El Pescador', organic: 'orgánico', price: 42 },
  { id: 2, name: 'Tomate cherry', category: 'verduras', producer: 'Huerto Bahía', organic: 'orgánico', price: 38 },
  { id: 3, name: 'Mango Ataulfo', category: 'frutas', producer: 'Huerto Bahía', organic: 'orgánico', price: 56 },
  { id: 4, name: 'Plátano macho', category: 'frutas', producer: 'Rancho El Pescador', organic: 'no orgánico', price: 28 },
  { id: 5, name: 'Queso fresco', category: 'lacteos', producer: 'Lácteos Nayarit', organic: 'orgánico', price: 88 },
  { id: 6, name: 'Yogur natural', category: 'lacteos', producer: 'Lácteos Nayarit', organic: 'no orgánico', price: 52 },
  { id: 7, name: 'Pan artesanal', category: 'artesanal', producer: 'Panadería de la Bahía', organic: 'orgánico', price: 65 },
  { id: 8, name: 'Aceite de oliva', category: 'artesanal', producer: 'Panadería de la Bahía', organic: 'orgánico', price: 125 }
];

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
    card.innerHTML = `
      <h4>${product.name}</h4>
      <div class="product-meta">
        <span>${product.category}</span>
        <span>${product.organic}</span>
        <span>${product.producer}</span>
      </div>
      <p class="price">$${product.price.toFixed(2)}</p>
      <button class="button secondary" onclick="addToCart(${product.id})">Agregar al carrito</button>
      <button class="button" style="margin-top:0.75rem;" onclick="addToPos(${product.id})">Agregar a POS</button>
    `;

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

  const total = subtotal + shippingCost;
  cartCount.textContent = entries.reduce((sum, [, qty]) => sum + qty, 0);
  subtotalLabel.textContent = `$${subtotal.toFixed(2)}`;
  shippingLabel.textContent = `$${shippingCost.toFixed(2)}`;
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

  orderMessage.textContent = `Pedido registrado. Gracias, ${name}! Entrega programada para ${time}.`;
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
    item.innerHTML = `
      <div>
        <div class="item-title">${product.name}</div>
        <div class="product-meta"><span>${qty} unidad(es)</span></div>
      </div>
      <div><strong>$${itemTotal.toFixed(2)}</strong></div>
    `;
    posItems.appendChild(item);
  });

  posTotalLabel.textContent = `$${total.toFixed(2)}`;
}

function checkoutPOS(method) {
  const count = Object.values(posTicket).reduce((sum, qty) => sum + qty, 0);
  if (!count) {
    posMessage.textContent = 'Agrega productos antes de cerrar el cobro.';
    return;
  }
  posMessage.textContent = `Ticket cerrado con ${method}. Total: ${posTotalLabel.textContent}.`;
  Object.keys(posTicket).forEach((key) => delete posTicket[key]);
  updatePosDisplay();
}

function scrollToCart() {
  document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });
}

['categoryFilter', 'organicFilter', 'producerFilter'].forEach((id) => {
  document.getElementById(id).addEventListener('change', renderProducts);
});

renderProducts();
updateCartDisplay();
updatePosDisplay();
