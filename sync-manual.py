#!/usr/bin/env python3
import json
import os
from datetime import datetime

# Configuración
PRODUCTOS_PATH = 'productos-manual.json'
OUTPUT_FILE = 'script.js'

def cargar_productos():
    """Carga productos desde el JSON local"""
    try:
        if not os.path.exists(PRODUCTOS_PATH):
            print(f'❌ Error: No se encontró {PRODUCTOS_PATH}')
            exit(1)
        
        with open(PRODUCTOS_PATH, 'r', encoding='utf-8') as f:
            productos = json.load(f)
        
        if not isinstance(productos, list):
            raise Exception('El archivo debe contener un array de productos')
        
        # Validar estructura
        for idx, p in enumerate(productos):
            if not all(k in p for k in ['id', 'name', 'category', 'producer', 'price']):
                raise Exception(f'Producto {idx + 1} incompleto. Requiere: id, name, category, producer, organic, price')
        
        print(f'✅ Se cargaron {len(productos)} productos')
        return productos
    
    except Exception as error:
        print(f'❌ Error cargando productos: {error}')
        exit(1)

def generar_script_js(productos):
    """Genera el contenido completo de script.js"""
    productos_json = json.dumps(productos, ensure_ascii=False, indent=2)
    
    return f"""const products = {productos_json};

const cart = {{}};
const posTicket = {{}};
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

function renderProducts() {{
  productGrid.innerHTML = '';
  const category = document.getElementById('categoryFilter').value;
  const organic = document.getElementById('organicFilter').value;
  const producer = document.getElementById('producerFilter').value;

  const filtered = products.filter((product) => {{
    const matchesCategory = category === 'all' || product.category === category;
    const matchesOrganic = organic === 'all' || product.organic === organic;
    const matchesProducer = producer === 'all' || product.producer === producer;
    return matchesCategory && matchesOrganic && matchesProducer;
  }});

  filtered.forEach((product) => {{
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <h4>${{product.name}}</h4>
      <div class="product-meta">
        <span>${{product.category}}</span>
        <span>${{product.organic}}</span>
        <span>${{product.producer}}</span>
      </div>
      <p class="price">$${{product.price.toFixed(2)}}</p>
      <button class="button secondary" onclick="addToCart(${{product.id}})">Agregar al carrito</button>
      <button class="button" style="margin-top:0.75rem;" onclick="addToPos(${{product.id}})">Agregar a POS</button>
    `;

    productGrid.appendChild(card);
  }});
}}

function addToCart(productId) {{
  if (!cart[productId]) cart[productId] = 0;
  cart[productId] += 1;
  updateCartDisplay();
}}

function addToPos(productId) {{
  if (!posTicket[productId]) posTicket[productId] = 0;
  posTicket[productId] += 1;
  updatePosDisplay();
}}

function updateCartDisplay() {{
  cartItems.innerHTML = '';
  const entries = Object.entries(cart);
  let subtotal = 0;

  if (!entries.length) {{
    cartItems.innerHTML = '<p>El carrito está vacío. Añade productos desde el market place.</p>';
  }}

  entries.forEach(([id, qty]) => {{
    const product = products.find((item) => item.id === Number(id));
    const itemTotal = product.price * qty;
    subtotal += itemTotal;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${{product.name}}</div>
        <div class="product-meta"><span>${{product.producer}}</span><span>${{product.category}}</span></div>
      </div>
      <div class="quantity-controls">
        <button onclick="changeQuantity(${{id}}, -1)">-</button>
        <span>${{qty}}</span>
        <button onclick="changeQuantity(${{id}}, 1)">+</button>
      </div>
      <div><strong>$${{itemTotal.toFixed(2)}}</strong></div>
    `;
    cartItems.appendChild(item);
  }});

  const total = subtotal + shippingCost;
  cartCount.textContent = entries.reduce((sum, [, qty]) => sum + qty, 0);
  subtotalLabel.textContent = `$${{subtotal.toFixed(2)}}`;
  shippingLabel.textContent = `$${{shippingCost.toFixed(2)}}`;
  totalLabel.textContent = `$${{total.toFixed(2)}}`;
}}

function changeQuantity(productId, delta) {{
  const current = cart[productId] || 0;
  const next = current + delta;
  if (next <= 0) {{
    delete cart[productId];
  }} else {{
    cart[productId] = next;
  }}
  updateCartDisplay();
}}

function submitOrder() {{
  const name = document.getElementById('customerName').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const time = document.getElementById('deliveryTime').value.trim();
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (!count) {{
    orderMessage.textContent = 'Agrega al menos un producto antes de confirmar.';
    return;
  }}
  if (!name || !address || !time) {{
    orderMessage.textContent = 'Completa todos los datos de entrega para enviar el pedido.';
    return;
  }}

  orderMessage.textContent = `Pedido registrado. Gracias, ${{name}}! Entrega programada para ${{time}}.`;
  Object.keys(cart).forEach((key) => delete cart[key]);
  updateCartDisplay();
}}

function updatePosDisplay() {{
  posItems.innerHTML = '';
  const entries = Object.entries(posTicket);
  let total = 0;

  if (!entries.length) {{
    posItems.innerHTML = '<p>El ticket está vacío. Agrega productos desde el market place.</p>';
  }}

  entries.forEach(([id, qty]) => {{
    const product = products.find((item) => item.id === Number(id));
    const itemTotal = product.price * qty;
    total += itemTotal;

    const item = document.createElement('div');
    item.className = 'pos-item';
    item.innerHTML = `
      <div>
        <div class="item-title">${{product.name}}</div>
        <div class="product-meta"><span>${{qty}} unidad(es)</span></div>
      </div>
      <div><strong>$${{itemTotal.toFixed(2)}}</strong></div>
    `;
    posItems.appendChild(item);
  }});

  posTotalLabel.textContent = `$${{total.toFixed(2)}}`;
}}

function checkoutPOS(method) {{
  const count = Object.values(posTicket).reduce((sum, qty) => sum + qty, 0);
  if (!count) {{
    posMessage.textContent = 'Agrega productos antes de cerrar el cobro.';
    return;
  }}
  posMessage.textContent = `Ticket cerrado con ${{method}}. Total: ${{posTotalLabel.textContent}}.`;
  Object.keys(posTicket).forEach((key) => delete posTicket[key]);
  updatePosDisplay();
}}

function scrollToCart() {{
  document.getElementById('pedidos').scrollIntoView({{ behavior: 'smooth' }});
}}

// Menu responsivo
const hamburger = document.getElementById('menuToggle');
const topNav = document.getElementById('topNav');

if (hamburger && topNav) {{
  hamburger.addEventListener('click', () => {{
    hamburger.classList.toggle('active');
    topNav.classList.toggle('active');
  }});

  topNav.querySelectorAll('a').forEach(link => {{
    link.addEventListener('click', () => {{
      hamburger.classList.remove('active');
      topNav.classList.remove('active');
    }});
  }});

  window.addEventListener('resize', () => {{
    if (window.innerWidth > 900) {{
      hamburger.classList.remove('active');
      topNav.classList.remove('active');
    }}
  }});
}}

// Animacion de conteo
function animateCounter(element, target, duration = 2000) {{
  let start = 0;
  const increment = target / (duration / 50);

  const timer = setInterval(() => {{
    start += increment;
    if (start >= target) {{
      element.textContent = target;
      clearInterval(timer);
    }} else {{
      element.textContent = Math.floor(start);
    }}
  }}, 50);
}}

function startCounterAnimation() {{
  const counters = document.querySelectorAll('.counter');
  let animationStarted = false;

  function checkVisibility() {{
    if (!animationStarted && counters.length > 0) {{
      const firstCounter = counters[0];
      const rect = firstCounter.getBoundingClientRect();
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {{
        counters.forEach(counter => {{
          const target = parseInt(counter.getAttribute('data-target'));
          animateCounter(counter, target);
        }});
        animationStarted = true;
        window.removeEventListener('scroll', checkVisibility);
      }}
    }}
  }}

  window.addEventListener('scroll', checkVisibility);
  checkVisibility();
}}

// Filtros y inicializacion
['categoryFilter', 'organicFilter', 'producerFilter'].forEach((id) => {{
  const element = document.getElementById(id);
  if (element) element.addEventListener('change', renderProducts);
}});

renderProducts();
updateCartDisplay();
updatePosDisplay();
startCounterAnimation();
"""

def guardar_archivo(contenido):
    """Guarda el archivo script.js"""
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f'✅ Archivo guardado: {OUTPUT_FILE}')
        return True
    except Exception as error:
        print(f'❌ Error guardando archivo: {error}')
        return False

def sincronizar():
    """Función principal de sincronización"""
    print('\n🔄 Sincronizando productos desde productos-manual.json...\n')
    
    productos = cargar_productos()
    
    if len(productos) == 0:
        print('⚠️  No hay productos para sincronizar')
        return
    
    script_js = generar_script_js(productos)
    guardado = guardar_archivo(script_js)
    
    if guardado:
        timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        print('\n✨ Sincronización manual completada exitosamente\n')
        print('📊 Resumen:')
        print(f'   - Productos: {len(productos)}')
        print(f'   - Archivo: {OUTPUT_FILE}')
        print(f'   - Timestamp: {timestamp}')
        print('\n💡 Tip: Edita productos-manual.json y ejecuta nuevamente\n')

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sincronizar()
