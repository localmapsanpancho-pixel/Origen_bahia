# Origen Bahía Tienda Orgánica

Sitio web con backend de servidor para la marca "Origen Bahía Tienda Orgánica" que incluye:

- Menú digital con filtros por categoría, distintivo orgánico y productor.
- Carrito interactivo con subtotal, envío y formulario de entrega.
- **Sistema de persistencia de pedidos** en Base de Datos SQLite.
- POS para cobrar productos en punto de venta.
- Secciones de suscripciones, canastas semanales, productores, marketplace y FAQ.
- Backend Flask para gestión de pedidos.

## Características Principales

### Persistencia de Pedidos
- Base de datos SQLite local
- Cada pedido incluye: nombre, dirección, hora, productos, total y timestamp
- Estado de pedido (pendiente, completado, etc.)
- Consultas de pedidos mediante API

### Deployment
- **Desarrollo Local**: http://localhost:3000/marketplace.html (con servidor Flask)
- **GitHub Pages**: https://localmapsanpancho-pixel.github.io/Origen_bahia/ (estático, sin backend)

## Instalación Rápida

### 1. Requisitos
- Python 3.9+
- Flask y Flask-CORS

### 2. Instalar Dependencias
```bash
python -m pip install flask flask-cors
```

### 3. Iniciar Servidor
```bash
# Opción 1: Comando directo
python -m flask --app=server_orders run --port=3000

# Opción 2: Script (Windows)
.\start_server.bat
```

### 4. Acceder
Abre en el navegador: **http://localhost:3000/marketplace.html**

## Estructura de Archivos

```
├── index.html              # Página de inicio
├── marketplace.html        # Tienda online
├── styles.css             # Estilos compartidos
├── script.js              # Lógica frontend
├── server_orders.py       # Backend Flask (NUEVO)
├── start_server.bat       # Script de inicio (NUEVO)
├── query_orders.py        # Consultar pedidos (NUEVO)
├── INSTALACION.md         # Guía detallada de instalación (NUEVO)
└── pedidos.db             # Base de datos (se crea automáticamente)
```

## Uso

1. **Desarrollo Local con Backend**:
   ```bash
   node server.js
   ```
   - Accede a http://localhost:3000/marketplace.html
   - Los pedidos se guardan automáticamente en `pedidos.db`

2. **Consultar Pedidos**:
   ```bash
   python query_orders.py
   ```

3. **Deployment del Backend Node.js**:
   - Usa Render, Heroku, Railway, Vercel (serverless), o similares.
   - El repositorio ya incluye `Procfile`, `package.json` con `start: node server.js`, y `render.yaml` para Render.
   - Asegura que tu backend exponga `/submit_order` y use `process.env.PORT`.
   - En Render, crea un servicio web y usa este repo.
   - Configura variables en el servidor remoto:
     - `MP_ACCESS_TOKEN`
     - `GOOGLE_SHEETS_ID` (opcional)
     - `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_SERVER`, `SMTP_PORT` si usas email
   - Actualiza en `marketplace.html`:
     ```html
     <script>
       window.BACKEND_URL = 'https://origen-bahia-backend.onrender.com';
     </script>
     ```
   - Así tu sitio en GitHub Pages puede enviar pedidos al backend remoto.

4. **Deployment en GitHub Pages** (Frontend estático):
   - El sitio está disponible en: https://localmapsanpancho-pixel.github.io/Origen_bahia/
   - Solo sirve HTML/CSS/JS estático.
   - Para guardar pedidos en producción necesitas el backend remoto configurado como `window.BACKEND_URL`.

## API de Pedidos

### POST /submit_order
Guardar un nuevo pedido

**Request**:
```json
{
  "nombre": "Juan Perez",
  "direccion": "Calle 123",
  "hora": "14:00",
  "cart": {"1": 2, "3": 1},
  "total": 150.5
}
```

**Response**:
```json
{
  "success": true,
  "pedidoId": 1,
  "mensaje": "Pedido #1 registrado exitosamente."
}
```

## Integración con Google Sheets (Opcional)

Para guardar pedidos también en Google Sheets, consulta [INSTALACION.md](./INSTALACION.md)

## Próximos Pasos

- [ ] Panel de administración para ver/editar pedidos
- [ ] Notificaciones por email
- [ ] Integración completa de Mercado Pago
- [ ] Despliegue en servidor de producción
- [ ] SMS o push notifications
- [ ] Exportación de reportes
