(function () {
  var LANG_KEY = "mb_lang";

  /* ============================================================
     DICCIONARIO — clave = texto exacto en español (normalizado:
     espacios/saltos de línea colapsados a uno solo, sin espacios
     al inicio/fin). Valor = HTML en inglés a insertar.
     ============================================================ */
  var DICTIONARY = {
    // Navegación / header
    "Mercado Bahía": "Mercado Bahía",
    "El Ciclo de la Tierra.": "The Cycle of the Earth.",
    "Ecosistema local de abastecimiento y consumo consciente para Bahía de Banderas.": "Local ecosystem for conscious sourcing and consumption in Bahía de Banderas.",
    "Términos y Privacidad": "Terms & Privacy",
    "Reglas claras para una compra tranquila.": "Clear rules for worry-free shopping.",
    "Inicio": "Home",
    "Tienda": "Shop",
    "Canastas": "Baskets",
    "Suscripciones": "Subscriptions",
    "Productores": "Producers",
    "Cómo funciona": "How it works",
    "← Volver al inicio": "← Back to home",

    // Hero banner
    "Bahía de Banderas · Nayarit": "Bahía de Banderas · Nayarit",
    "De la tierra a tu mesa": "From the earth to your table",
    "Productores aliados, cosechas frescas, productos artesanales.": "Partner producers, fresh harvests, artisanal products.",
    "El ciclo de la Tierra": "The cycle of the Earth",
    "Alimentación consciente": "Conscious<br>nutrition",
    "Somos una red de productores que comparten nuestra visión de sustentabilidad y responsabilidad. Bajo una promesa de servicio inquebrantable: frescura total cada semana. Un ecosistema digital pensado para conectar consumidores con productores conscientes. Hemos construido un puente que respeta el ciclo de la tierra y lo lleva hasta la puerta de tu hogar. La forma más fácil de recibir los mejores productos orgánicos, artesanales y locales en Bahía de Banderas, Nayarit.":
      "We're a network of producers who share our vision of sustainability and responsibility, under an unwavering promise of service: total freshness every week.<br><br>A digital ecosystem built to connect consumers with conscious producers.<br>We've built a bridge that respects the cycle of the earth and brings it straight to your door.<br><br>The easiest way to get the best organic, artisanal, and local products in Bahía de Banderas, Nayarit.",
    "Explorar tienda": "Explore shop",
    "Ver suscripciones": "View subscriptions",
    "Canasta semanal": "Weekly basket",

    // Cómo funciona
    "Comunidad Estratégica": "Strategic Community",
    "Entendemos que comer bien comienza conociendo el origen de lo que nos nutre.": "We believe eating well starts with knowing the origin of what nourishes us.",
    "Red de Productores": "Producer Network",
    "El proyecto busca conectar consumidores conscientes con productores locales mediante un sistema de compra simple, confiable y conveniente, profesionalizando la relación con el productor local para asegurar la continuidad de la excelencia.":
      "The project connects conscious consumers with local producers through a simple, reliable, and convenient buying system, professionalizing the relationship with local producers to ensure lasting excellence.",
    "Sustentabilidad": "Sustainability",
    "Gestión de recursos orientada a la regeneración del suelo y la preservación del capital natural regional.": "Resource management focused on soil regeneration and preserving regional natural capital.",
    "Transparencia": "Transparency",
    "Compromiso ineludible con la trazabilidad absoluta, permitiendo al cliente conocer la historia y el punto exacto de procedencia de cada insumo.": "An unwavering commitment to full traceability, letting customers know the story and exact origin of every product.",
    "Calidad de Origen": "Quality of Origin",
    "Rigurosa selección de productos que representan la máxima expresión de la biodiversidad local y la maestría artesanal.": "A rigorous selection of products representing the finest expression of local biodiversity and artisanal craftsmanship.",

    // Canastas
    "Canastas de Temporada": "Seasonal Baskets",
    "Variedades frescas cada semana": "Fresh varieties every week",
    "Lleva una canasta lista cuando la necesites. Pedido único — sin compromiso de suscripción.": "Grab a ready-made basket whenever you need it. One-time order — no subscription required.",
    "Pedidos: Lunes antes de las 2:00 pm.": "Orders: Monday before 2:00 pm.",
    "Día de entrega: Miércoles.": "Delivery day: Wednesday.",
    "Horarios de Entregas de 9:30 a 12:30 hrs. Mezcales, Bucerías, Nvo. Vallarta": "Delivery hours 9:30 am–12:30 pm: Mezcales, Bucerías, Nuevo Vallarta",
    "Horarios de Entregas de 14:00 a 17:00 hrs. San Pancho, Sayulita, Punta de Mita, Lo de Marcos": "Delivery hours 2:00–5:00 pm: San Pancho, Sayulita, Punta de Mita, Lo de Marcos",
    "Canasta Verde": "Green Basket",
    "Selección orgánica de verduras, hierbas aromáticas y acompañamientos frescos seleccionados diariamente de nuestros huertos.": "Organic selection of vegetables, aromatic herbs, and fresh sides picked daily from our gardens.",
    "Incluye: Acelga (230 g) / Aguacate (1 pieza ≈200 g) / Albahaca italiana (80 g) / Apio (500 g) / Arúgula (100 g) / Calabaza (1 kg) / Cebolla cambray (1 manojo ≈200 g) / Cilantro (80 g) / Cúrcuma (250 g) / Espinaca (80 g) / Huevo orgánico (12 piezas ≈720 g) / Jengibre (250 g) / Jitomate cherry (250 g) / Lechuga italiana (1 pieza ≈350 g) / Lechuga mixta (paq. 200 g) / Lechuga orejona (1 pieza ≈400 g) / Pepino Eureka (500 g) / Perejil italiano (80 g) / Romero (40 g) / Tortillas de maíz azul (500 g)":
      "Includes: Swiss chard (230 g) / Avocado (1 piece ≈200 g) / Italian basil (80 g) / Celery (500 g) / Arugula (100 g) / Squash (1 kg) / Green onion (1 bunch ≈200 g) / Cilantro (80 g) / Turmeric (250 g) / Spinach (80 g) / Organic egg (12 pcs ≈720 g) / Ginger (250 g) / Cherry tomato (250 g) / Italian lettuce (1 piece ≈350 g) / Mixed lettuce (200 g pack) / Romaine lettuce (1 piece ≈400 g) / Eureka cucumber (500 g) / Italian parsley (80 g) / Rosemary (40 g) / Blue corn tortillas (500 g)",
    "Peso total aproximado: 6.51 kg.": "Approx. total weight: 6.51 kg.",
    "Envío Gratis": "Free Shipping",
    "Comprar": "Buy",
    "Más pedida": "Most popular",
    "Canasta Premium": "Premium Basket",
    "Selección orgánica de verduras, hierbas aromáticas y una propuesta con los mejores productos premium para disfrutar.": "Organic selection of vegetables, aromatic herbs, and a lineup of the best premium products to enjoy.",
    "Incluye: Acelga (230 g) / Aguacate (1 pieza ≈200 g) / Albahaca italiana (80 g) / Apio (500 g) / Arúgula (100 g) / Calabaza (1 kg) / Cebolla cambray (1 manojo ≈200 g) / Cilantro (80 g) / Cúrcuma (250 g) / Espinaca (80 g) / Huevo orgánico (12 piezas ≈720 g) / Jengibre (250 g) / Jitomate cherry (250 g) / Lechuga italiana (1 pieza ≈350 g) / Lechuga mixta (paq. 200 g) / Lechuga orejona (1 pieza ≈400 g) / Pepino Eureka (500 g) / Perejil italiano (80 g) / Romero (40 g) / Tortillas de maíz azul (500 g) Pan de Masa Madre (1 pieza ≈500 g) / Queso Fresco (250 g) / Miel de Abeja (250 g) / Yogurt natural (460 ml)":
      "Includes: Swiss chard (230 g) / Avocado (1 piece ≈200 g) / Italian basil (80 g) / Celery (500 g) / Arugula (100 g) / Squash (1 kg) / Green onion (1 bunch ≈200 g) / Cilantro (80 g) / Turmeric (250 g) / Spinach (80 g) / Organic egg (12 pcs ≈720 g) / Ginger (250 g) / Cherry tomato (250 g) / Italian lettuce (1 piece ≈350 g) / Mixed lettuce (200 g pack) / Romaine lettuce (1 piece ≈400 g) / Eureka cucumber (500 g) / Italian parsley (80 g) / Rosemary (40 g) / Blue corn tortillas (500 g) Sourdough bread (1 piece ≈500 g) / Fresh cheese (250 g) / Honey (250 g) / Natural yogurt (460 ml)",
    "Peso total aproximado: 7.97 kg.": "Approx. total weight: 7.97 kg.",

    // Suscripciones
    "Obtén más beneficios": "Get more benefits",
    "Suscripciones Mensual": "Monthly Subscription",
    "Recibe productos frescos cada semana, descuentos, productos sorpresos y envíos gratis.": "Get fresh products every week, discounts, surprise items, and free shipping.",
    "Básica": "Basic",
    "$349 MXN / MES": "$349 MXN / MONTH",
    "Perfecto para no perder tu rutina cada semana y obtener descuentos. También contamos con atención personalizada para Chefs y restaurantes": "Perfect for keeping your weekly routine and getting discounts. We also offer personalized service for chefs and restaurants.",
    "4 entregas al mes sin costo. Aplica mínimo de compra": "4 free deliveries a month. Minimum purchase applies",
    "Un 5% de descuento en productos seleccionados.": "5% discount on selected products.",
    "Un producto sorpresa especial en la compra de cualquier canasta.": "A special surprise product with any basket purchase.",
    "Acceso a ofertas especiales solo para miembros.": "Access to member-only special offers.",
    "Acceso prioritario a productos de temporada y ediciones limitadas.": "Priority access to seasonal and limited-edition products.",
    "Suscribirse Ahora": "Subscribe Now",

    // Productores
    "Productores Locales": "Local Producers",
    "Conoce a quienes cultivan tu comida": "Meet the people who grow your food",
    "🤝 Productores Aliados Verificados": "🤝 Verified Partner Producers",
    "Conoce a los productores que cultivan con compromiso en Bahía de Banderas. Cada aliado cumple estándares de sustentabilidad.": "Meet the producers who farm with commitment in Bahía de Banderas. Every partner meets sustainability standards.",
    "Productor comprometido con la producción orgánica y la entrega de productos frescos de temporada.": "A producer committed to organic farming and delivering fresh, seasonal products.",
    "Especialistas en cacao de calidad con enfoque en procesos responsables y sabores auténticos.": "Cacao specialists focused on responsible processes and authentic flavors.",
    "Productores locales que combinan tradición, cuidado del suelo y productos de origen confiable.": "Local producers blending tradition, soil care, and trustworthy sourcing.",
    "Aliado presente en la oferta local con productos que reflejan una visión integral de bienestar.": "A local partner offering products that reflect a holistic vision of wellbeing.",
    "Panadería artesanal que aporta productos elaborados con tradición y sabor característico.": "An artisanal bakery bringing products made with tradition and signature flavor.",
    "Productor de alimentos con identidad local y dedicación a una producción responsable.": "A food producer with local identity and a commitment to responsible production.",
    "Aliado apícola que ofrece productos naturales con trazabilidad y cuidado desde la colmena.": "A beekeeping partner offering natural products, traceable with care from the hive.",
    "Especialistas en germinados y cultivos frescos con énfasis en calidad y nutrición.": "Specialists in sprouts and fresh crops with an emphasis on quality and nutrition.",
    "Productor enfocado en bebidas y preparados frescos con ingredientes locales y de temporada.": "A producer focused on fresh drinks and preparations using local, seasonal ingredients.",
    "Ofrece productos de cuidado personal 100% artesanales y naturales, elaborados con cuidado y autenticidad.": "Offers 100% artisanal, natural personal care products made with care and authenticity.",
    "Productores de especias y condimentos que aportan identidad, sabor y valor a la canasta local.": "Producers of spices and seasonings adding identity, flavor, and value to the local basket.",

    // Footer / genérico (compartido en las 3 páginas)
    "Tienda orgánica local de Bahía de Banderas. Conectamos productores y consumidores conscientes.": "Local organic shop in Bahía de Banderas. Connecting producers and conscious consumers.",
    "Tienda orgánica local de Bahía de Banderas.": "Local organic shop in Bahía de Banderas.",
    "Contacto": "Contact",
    "Síguenos": "Follow us",
    "Legal": "Legal",
    "Términos y condiciones": "Terms & conditions",
    "Política de privacidad": "Privacy policy",
    "© 2026 Mercado Bahía Tienda Orgánica · Bahía de Banderas, Nayarit · El Ciclo de la Tierra": "© 2026 Mercado Bahía Organic Shop · Bahía de Banderas, Nayarit · The Cycle of the Earth",
    "© 2026 Mercado Bahía Tienda Orgánica · Bahía de Banderas, Nayarit · Sustentabilidad en cada compra": "© 2026 Mercado Bahía Organic Shop · Bahía de Banderas, Nayarit · Sustainability in every purchase",
    "© 2026 Origen Bahía Tienda Orgánica · Bahía de Banderas, Nayarit": "© 2026 Origen Bahía Organic Shop · Bahía de Banderas, Nayarit",
    "🕘 Lun – Sáb · 8:00 – 18:00": "🕘 Mon – Sat · 8:00 am – 6:00 pm",
    "¿Hablamos?": "Let's talk?",
    "Volver al Inicio": "Back to Home",

    // Marketplace — filtros y tienda
    "Tienda en Línea": "Online Shop",
    "Compra directamente de productores locales": "Shop directly from local producers",
    "Filtra por categoría, certificación orgánica y productor. Actualizado con productos de temporada.": "Filter by category, organic certification, and producer. Updated with seasonal products.",
    "Categoría": "Category",
    "Todas las categorías": "All categories",
    "Verduras": "Vegetables",
    "Ayurvédicos": "Ayurvedic",
    "Lácteos": "Dairy",
    "Distintivo": "Certification",
    "Todos los productos": "All products",
    "👩‍🌾 Orgánico Certificado": "👩‍🌾 Certified Organic",
    "✨ Artesanal": "✨ Artisanal",
    "Sin distintivo": "No certification",
    "Productor": "Producer",
    "Todos los productores": "All producers",
    "Filtrar": "Filter",
    "Ver carrito": "View cart",

    // Carrito / checkout
    "Tu Compra": "Your Order",
    "Carrito de Compra": "Shopping Cart",
    "🛒 Tu Carrito": "🛒 Your Cart",
    "Revisa tu carrito, ajusta cantidades y confirma tu pedido.": "Review your cart, adjust quantities, and confirm your order.",
    "Subtotal:": "Subtotal:",
    "Estoy de acuerdo con los términos y condiciones": 'I agree to the <a href="terminos.html" target="_blank" rel="noopener">terms and conditions</a>',
    "📦 El costo de envío se calcula según tu código postal y localidad. En compras arriba de $1,500 el envío es ¡Gratis!": "📦 Shipping cost is calculated based on your postal code and locality. On orders over $1,500 shipping is free!",
    "Envío:": "Shipping:",
    "Zona Bahía de Banderas": "Bahía de Banderas Zone",
    "Ingresa tu código postal y localidad para ver el costo de envío.": "Enter your postal code and locality to see the shipping cost.",
    "Código postal": "Postal code",
    "Localidad": "Locality",
    "Selecciona una localidad": "Select a locality",
    "💰 Total:": "💰 Total:",
    "📋 Datos de entrega": "📋 Delivery details",
    "Nombre completo": "Full name",
    "Email": "Email",
    "Teléfono / WhatsApp": "Phone / WhatsApp",
    "Dirección de entrega": "Delivery address",
    "Horario preferido": "Preferred time",
    "💳 Método de pago": "💳 Payment method",
    "💵 Efectivo al recibir": "💵 Cash on delivery",
    "💳 Tarjeta al recibir": "💳 Card on delivery",
    "🏦 Transferencia bancaria": "🏦 Bank transfer",
    "✓ Confirmar pedido": "✓ Confirm order",
    "¡Pedido confirmado!": "Order confirmed!",
    "Total:": "Total:",
    "Método de pago:": "Payment method:",
    "Te contactaremos por WhatsApp para confirmar la entrega. ¡Gracias por apoyar lo local!": "We'll contact you on WhatsApp to confirm delivery. Thanks for supporting local!",
    "Hacer otro pedido": "Place another order",
    "Avisar por WhatsApp": "Notify via WhatsApp",

    // Mensajes / toasts
    "Agrega al menos un producto antes de confirmar.": "Add at least one product before confirming.",
    "Debes aceptar los términos y condiciones para continuar.": "You must accept the terms and conditions to continue.",
    "Completa todos los datos de entrega para enviar el pedido.": "Fill in all delivery details to submit your order.",
    "Ingresa tu código postal y selecciona la localidad para calcular el envío.": "Enter your postal code and select your locality to calculate shipping.",
    "Completa el envío": "Complete shipping info",
    "El código postal y la localidad no coinciden con los envíos disponibles.": "That postal code and locality don't match our delivery zones.",
    "Selecciona la localidad para calcular el envío.": "Select your locality to calculate shipping.",
    "El carrito está vacío. Añade productos desde el market place.": "Your cart is empty. Add products from the shop.",
    "El carrito está vacío.": "Your cart is empty.",
    "Enviando pedido...": "Sending order...",
    "No hay productos disponibles en este momento.": "No products available right now.",
    "Cargando productos frescos…": "Loading fresh products…",
    "Ningún producto coincide con los filtros.": "No products match the selected filters.",
    "Producto desconocido": "Unknown product",

    // Términos y condiciones
    "1. Términos y Condiciones de Uso": "1. Terms and Conditions of Use",
    "Última actualización: Enero 2026": "<strong>Last updated:</strong> January 2026",
    "Al utilizar Origen Bahía (sitio web alojado en localmapsanpancho-pixel.github.io/Origen_bahia) aceptas los siguientes términos. Si no estás de acuerdo, te pedimos no realizar pedidos.": "By using Origen Bahía (website hosted at localmapsanpancho-pixel.github.io/Origen_bahia) you accept the following terms. If you disagree, please do not place orders.",
    "1.1 Quiénes somos": "1.1 Who we are",
    "Origen Bahía es una tienda orgánica local que conecta a productores de Bahía de Banderas, Nayarit, con consumidores conscientes. Operamos como un canal de venta directa entre productores aliados verificados y clientes finales.": "Origen Bahía is a local organic shop connecting producers in Bahía de Banderas, Nayarit, with conscious consumers. We operate as a direct sales channel between verified partner producers and end customers.",
    "1.2 Pedidos y precios": "1.2 Orders and pricing",
    "Todos los precios se muestran en pesos mexicanos (MXN).": "All prices are shown in <strong>Mexican pesos (MXN)</strong>.",
    "La compra mínima es de $800 MXN.": "The <strong>minimum purchase</strong> is <strong>$800 MXN</strong>.",
    "El costo de envío es de $150 MXN; en compras superiores a $1,500 MXN el envío es gratuito.": "<strong>Shipping cost</strong> is <strong>$150 MXN</strong>; on orders over <strong>$1,500 MXN</strong> shipping is <strong>free</strong>.",
    "Los precios pueden actualizarse sin previo aviso. El precio aplicable es el vigente al momento de confirmar el pedido.": "Prices may be updated without prior notice. The applicable price is the one in effect when the order is confirmed.",
    "La disponibilidad de productos depende de la temporada y de nuestros productores aliados.": "Product availability depends on the season and on our partner producers.",
    "1.3 Métodos de pago": "1.3 Payment methods",
    "Aceptamos los siguientes métodos al momento de la entrega:": "We accept the following methods at the time of delivery:",
    "💵 Efectivo": "💵 Cash",
    "💳 Tarjeta (terminal en sitio)": "💳 Card (on-site terminal)",
    "🏦 Transferencia bancaria (datos por WhatsApp tras confirmar el pedido)": "🏦 Bank transfer (details via WhatsApp after confirming your order)",
    "1.4 Tiempos de entrega": "1.4 Delivery times",
    "Operamos en Bahía de Banderas, Nayarit y zonas cercanas de Puerto Vallarta.": "We operate in Bahía de Banderas, Nayarit and nearby areas of Puerto Vallarta.",
    "Las entregas se programan en franjas horarias acordadas al confirmar el pedido por WhatsApp.": "Deliveries are scheduled in time windows agreed upon when confirming the order via WhatsApp.",
    "1.5 Suscripciones": "1.5 Subscriptions",
    "Las suscripciones mensuales ($349). Puedes pausar, modificar o cancelar avisando con al menos 48 hrs de anticipación a través de WhatsApp (+52 322 429 1915).": "Monthly subscriptions ($349). You can pause, modify, or cancel by giving at least <strong>48 hours notice</strong> via WhatsApp (+52 322 429 1915).",
    "1.6 Política de devoluciones y reembolsos": "1.6 Returns and refunds policy",
    "Si un producto llega dañado, en mal estado o no corresponde a lo pedido, contáctanos en las primeras 24 horas tras la entrega.": "If a product arrives <strong>damaged, spoiled, or doesn't match your order</strong>, contact us within the first <strong>24 hours</strong> after delivery.",
    "Reemplazamos el producto en el siguiente envío o procesamos un reembolso completo, según prefieras.": "We'll replace the product in the next delivery or process a full refund, whichever you prefer.",
    "Los productos frescos perecederos no se aceptan en devolución después de las 24 hrs por motivos sanitarios.": "Fresh perishable products can't be returned after 24 hours for health reasons.",
    "1.7 Uso del sitio": "1.7 Use of the site",
    "Te comprometes a usar el sitio de manera responsable, no intentar acceder a sistemas internos, y proporcionar información veraz al momento de hacer un pedido.": "You agree to use the site responsibly, not attempt to access internal systems, and provide accurate information when placing an order.",
    "2. Política de Privacidad": "2. Privacy Policy",
    "En Origen Bahía respetamos tu privacidad. Esta sección explica qué información recopilamos y cómo la usamos.": "At Origen Bahía we respect your privacy. This section explains what information we collect and how we use it.",
    "2.1 Información que recopilamos": "2.1 Information we collect",
    "Datos de contacto: nombre, email, teléfono y dirección, recopilados al hacer un pedido.": "<strong>Contact details:</strong> name, email, phone, and address, collected when placing an order.",
    "Datos del pedido: productos comprados, horario preferido, método de pago, monto.": "<strong>Order details:</strong> products purchased, preferred time, payment method, amount.",
    "Datos técnicos básicos: el carrito se guarda localmente en tu navegador (localStorage) para mantener tu compra entre páginas. No usamos cookies de seguimiento ni herramientas de rastreo publicitario.": "<strong>Basic technical data:</strong> the cart is saved locally in your browser (localStorage) to keep your purchase across pages. We don't use tracking cookies or advertising trackers.",
    "2.2 Cómo usamos tu información": "2.2 How we use your information",
    "Procesar y entregar tus pedidos.": "Process and deliver your orders.",
    "Contactarte por WhatsApp o email para confirmar entregas o resolver dudas.": "Contact you via WhatsApp or email to confirm deliveries or answer questions.",
    "Mejorar la experiencia del sitio y la oferta de productos.": "Improve the site experience and product offering.",
    "2.3 Con quién compartimos tu información": "2.3 Who we share your information with",
    "Productores aliados: solo nombre y dirección para coordinar la entrega cuando es entrega directa del productor.": "<strong>Partner producers:</strong> only name and address to coordinate delivery when it's a direct delivery from the producer.",
    "Servicios de soporte técnico: Google Sheets (almacenamiento de pedidos), Render (backend) y GitHub Pages (sitio web). No vendemos tus datos a terceros y solo los compartimos cuando es necesario para procesar tu pedido o cumplir con obligaciones legales.": "<strong>Technical support services:</strong> Google Sheets (order storage), Render (backend), and GitHub Pages (website). We don't sell your data to third parties and only share it when necessary to process your order or comply with legal obligations.",
    "2.4 Tus derechos": "2.4 Your rights",
    "Puedes solicitar en cualquier momento:": "You can request at any time:",
    "Acceso a la información que tenemos sobre ti.": "Access to the information we have about you.",
    "Corrección de datos incorrectos.": "Correction of inaccurate data.",
    "Eliminación de tus datos (excepto cuando estemos obligados a conservarlos por temas fiscales o legales).": "Deletion of your data (except when we're legally required to keep it for tax or legal reasons).",
    "Para ejercer estos derechos escríbenos al WhatsApp +52 322 380 9440.": "To exercise these rights, message us on WhatsApp at <strong>+52 322 380 9440</strong>.",
    "2.5 Seguridad": "2.5 Security",
    "Tus datos se almacenan en servicios cifrados (Google Sheets, Render). No solicitamos números de tarjeta de crédito ni claves bancarias por el sitio: los pagos con tarjeta se realizan en la entrega con terminal.": "Your data is stored using encrypted services (Google Sheets, Render). We never ask for credit card numbers or banking passwords through the site: card payments are made on delivery using a terminal.",
    "3. Contacto": "3. Contact",
    "Si tienes dudas sobre estos términos o sobre tu pedido, escríbenos:": "If you have questions about these terms or your order, message us:",
    "📱 WhatsApp: +52 322 380 9440": '📱 WhatsApp: <a href="https://wa.me/523223809440">+52 322 380 9440</a>',
    "📍 Bahía de Banderas, Nayarit, México": "📍 Bahía de Banderas, Nayarit, Mexico",
    "🕘 Lunes a Sábado · 8:00 – 18:00": "🕘 Monday to Saturday · 8:00 am – 6:00 pm"
  };

  /* Reglas por expresión regular, para textos con partes dinámicas
     (contadores, montos, nombres de producto, etc.) */
  var REGEX_RULES = [
    [/^🛒 Carrito: (\d+) artículos?$/, function (m, p1) { return "🛒 Cart: " + p1 + " item" + (p1 === "1" ? "" : "s"); }],
    [/^Agregado: (.+)$/, function (m, p1) { return "Added: " + p1; }],
    [/^La compra mínima es de \$(\S+)\. Te faltan \$(\S+) para completar el pedido\.$/, function (m, p1, p2) { return "Minimum purchase is $" + p1 + ". You need $" + p2 + " more to complete your order."; }],
    [/^Envío para (.+) • (.+): \$(\S+)$/, function (m, p1, p2, p3) { return "Shipping for " + p1 + " • " + p2 + ": $" + p3; }]
  ];

  /* Atributos (placeholder / aria-label / title) */
  var ATTR_DICTIONARY = {
    "Abrir menú": "Open menu",
    "Contáctanos por WhatsApp": "Contact us on WhatsApp",
    "Facebook": "Facebook",
    "Instagram": "Instagram",
    "WhatsApp": "WhatsApp",
    "Ver carrito": "View cart",
    "Origen Bahía — Productos frescos locales": "Origen Bahía — Fresh local products",
    "55 1234 5678": "55 1234 5678",
    "Calle y número": "Street and number",
    "Ej. 63729": "E.g. 63729",
    "Ej. Mañana 9-12 horas": "E.g. Morning 9am–12pm",
    "Tu nombre": "Your name",
    "tu@email.com": "you@email.com"
  };

  /* ============================================================
     MOTOR DE TRADUCCIÓN
     ============================================================ */
  var INLINE_TAGS = { A: 1, STRONG: 1, B: 1, EM: 1, SMALL: 1, SPAN: 1, BR: 1, CODE: 1, I: 1 };
  var CONTAINER_TAGS = { DIV: 1, NAV: 1, UL: 1, OL: 1, HEADER: 1, FOOTER: 1, SECTION: 1, ARTICLE: 1, MAIN: 1, BODY: 1, FORM: 1 };
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };

  var seenEl = new WeakMap();
  var seenTx = new WeakMap();

  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }

  function textFromHTML(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    return norm(tmp.textContent);
  }

  function isLeafEl(el) {
    var kids = el.children;
    if (!kids.length) return true;
    if (CONTAINER_TAGS[el.tagName]) return false;
    for (var i = 0; i < kids.length; i++) {
      if (!INLINE_TAGS[kids[i].tagName]) return false;
    }
    return true;
  }

  function applyRules(key) {
    if (Object.prototype.hasOwnProperty.call(DICTIONARY, key)) return DICTIONARY[key];
    for (var i = 0; i < REGEX_RULES.length; i++) {
      var re = REGEX_RULES[i][0];
      if (re.test(key)) return key.replace(re, REGEX_RULES[i][1]);
    }
    return null;
  }

  function translateLeaf(el, lang) {
    if (!seenEl.has(el)) seenEl.set(el, el.innerHTML);
    if (lang === "es") {
      el.innerHTML = seenEl.get(el);
      return;
    }
    var key = textFromHTML(seenEl.get(el));
    if (!key) return;
    var val = applyRules(key);
    if (val !== null) el.innerHTML = val;
  }

  function translateText(node, lang) {
    if (!seenTx.has(node)) seenTx.set(node, node.data);
    if (lang === "es") {
      node.data = seenTx.get(node);
      return;
    }
    var key = norm(seenTx.get(node));
    if (!key) return;
    var val = applyRules(key);
    if (val !== null) node.data = val;
  }

  function translateAttrs(el, lang) {
    ["placeholder", "aria-label", "title"].forEach(function (attr) {
      if (!el.hasAttribute || !el.hasAttribute(attr)) return;
      if (!seenEl.has(el)) seenEl.set(el, {});
      var store = seenEl.get(el);
      if (typeof store === "string") return; // ya usado para innerHTML, no colisiona
      var key = "attr:" + attr;
      if (!(key in store)) store[key] = el.getAttribute(attr);
      if (lang === "es") {
        el.setAttribute(attr, store[key]);
        return;
      }
      var val = ATTR_DICTIONARY[norm(store[key])];
      if (val) el.setAttribute(attr, val);
    });
  }

  function walk(el, lang) {
    if (!el || SKIP_TAGS[el.tagName]) return;
    if (el.hasAttribute && (el.hasAttribute("placeholder") || el.hasAttribute("aria-label") || el.hasAttribute("title"))) {
      translateAttrs(el, lang);
    }
    if (isLeafEl(el)) {
      var key = norm(el.textContent);
      if (key) translateLeaf(el, lang);
      return;
    }
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        if (norm(node.data)) translateText(node, lang);
      } else if (node.nodeType === 1) {
        walk(node, lang);
      }
    });
  }

  /* ============================================================
     TOGGLE + PERSISTENCIA + OBSERVER
     ============================================================ */
  function currentLang() {
    try { return localStorage.getItem(LANG_KEY) || "es"; } catch (e) { return "es"; }
  }

  function setLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    observer.disconnect();
    walk(document.body, lang);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    updateToggleUI(lang);
    window.dispatchEvent(new CustomEvent("mb:langchange", { detail: { lang: lang } }));
  }

  var toggleBtn = null;
  function updateToggleUI(lang) {
    if (!toggleBtn) return;
    var esBtn = toggleBtn.querySelector('[data-lang="es"]');
    var enBtn = toggleBtn.querySelector('[data-lang="en"]');
    if (esBtn) esBtn.classList.toggle("mb-lang-active", lang === "es");
    if (enBtn) enBtn.classList.toggle("mb-lang-active", lang === "en");
  }

  function injectToggle() {
    var nav = document.getElementById("topNav") || document.querySelector(".top-nav");
    if (!nav) return;

    var style = document.createElement("style");
    style.textContent =
      ".mb-lang-toggle{display:inline-flex;align-items:center;gap:2px;border:1px solid rgba(107,78,61,0.25);border-radius:999px;padding:2px;margin-left:0.5rem;background:#fff;}" +
      ".mb-lang-toggle button{border:none;background:transparent;padding:4px 10px;font-size:0.78rem;font-weight:600;border-radius:999px;cursor:pointer;color:var(--text-secondary,#6b5f52);line-height:1.4;}" +
      ".mb-lang-toggle button.mb-lang-active{background:var(--accent,#6b4e3d);color:#fff;}";
    document.head.appendChild(style);

    var wrap = document.createElement("div");
    wrap.className = "mb-lang-toggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Idioma / Language");
    wrap.innerHTML =
      '<button type="button" data-lang="es">ES</button>' +
      '<button type="button" data-lang="en">EN</button>';

    nav.appendChild(wrap);
    toggleBtn = wrap;

    wrap.querySelector('[data-lang="es"]').addEventListener("click", function () { setLang("es"); });
    wrap.querySelector('[data-lang="en"]').addEventListener("click", function () { setLang("en"); });
  }

  var scheduled = false;
  var observer = new MutationObserver(function () {
    if (currentLang() !== "en" || scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      observer.disconnect();
      walk(document.body, "en");
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }, 60);
  });

  function init() {
    injectToggle();
    var lang = currentLang();
    document.documentElement.lang = lang;
    walk(document.body, lang);
    updateToggleUI(lang);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
