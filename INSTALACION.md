# Sistema de Gestión de Pedidos - Origen Bahía Tienda

## Resumen

El sistema ahora incluye **persistencia de pedidos automática** en una base de datos SQLite local. Los pedidos se guardan cuando se confirman en la tienda online.

## Instalación

### 1. Requisitos Previos
- Python 3.9+ 
- Git
- Navegador web moderno

### 2. Pasos de Configuración

#### Opción A: En Windows con Python
```bash
# Ir al directorio del proyecto
cd OrigenBahiaTienda

# Instalar dependencias de Python
python -m pip install flask flask-cors

# Iniciar servidor
python -m flask --app=server_orders run --port=3000
```

El servidor estará disponible en: **http://localhost:3000/marketplace.html**

#### Opción B: Usando el script de inicio
```bash
# Navegar al directorio
cd OrigenBahiaTienda

# Ejecutar start_server.bat (Windows)
.\start_server.bat
```

## Estructura del Sistema

### Base de Datos SQLite
- **Ubicación**: `pedidos.db` (se crea automáticamente)
- **Tabla**: `pedidos` con los siguientes campos:
  - `id` (AUTO INCREMENT)
  - `nombre` - Nombre del cliente
  - `direccion` - Dirección de entrega
  - `hora_entrega` - Hora solicitada
  - `productos` - JSON con productos y cantidades
  - `total` - Total del pedido
  - `fecha` - Timestamp automático
  - `estado` - Estado del pedido (default: "pendiente")

### Archivos Principales
- **server_orders.py** - Servidor Flask con endpoints REST
- **script.js** - Frontend actualizado con envío de pedidos
- **marketplace.html** - Página de tienda online
- **index.html** - Página de inicio
- **styles.css** - Estilos (sin cambios)

## Endpoints de la API

### POST /submit_order
Guardar un nuevo pedido.

**Request:**
```json
{
  "nombre": "Juan Perez",
  "direccion": "Calle Principal 123",
  "hora": "14:00",
  "cart": {"1": 2, "3": 1},
  "total": 150.5
}
```

**Response:**
```json
{
  "success": true,
  "pedidoId": 1,
  "mensaje": "Pedido #1 registrado exitosamente."
}
```

## Consultar Pedidos

Para ver los pedidos guardados, ejecutar:
```bash
python query_orders.py
```

O acceder mediante Python:
```python
import sqlite3

conn = sqlite3.connect('pedidos.db')
c = conn.cursor()
c.execute('SELECT * FROM pedidos')
for row in c.fetchall():
    print(row)
conn.close()
```

## Integración con Google Sheets (Opcional)

Para guardar pedidos también en Google Sheets:

1. Crear Service Account en Google Cloud Console
2. Descargar credenciales como `credentials.json`
3. Crear hoja de cálculo y copiar ID
4. Establecer variable de entorno:
   ```bash
   $env:GOOGLE_SHEETS_ID="tu_id_aqui"  # PowerShell
   export GOOGLE_SHEETS_ID="tu_id_aqui"  # Linux/Mac
   ```
5. Instalar cliente de Google:
   ```bash
   pip install google-auth-httplib2 google-api-python-client
   ```

## Deployment en GitHub Pages

El sitio se despliega automáticamente en:
https://localmapsanpancho-pixel.github.io/Origen_bahia/

**Nota**: GitHub Pages no soporta backends dinámicos. Los pedidos solo se guardan localmente cuando el servidor Python está ejecutándose en `localhost:3000`.

Para usar en producción:
- Desplegar `server_orders.py` en un servidor web (Heroku, AWS, Azure, etc.)
- Actualizar `script.js` con la URL del servidor en producción

## Testing

Se incluye `test_order.py` para pruebas de envío de pedidos:
```bash
python test_order.py
```

## Logs y Debugging

El servidor Flask muestra logs en tiempo real:
- **Inicialización**: "Serving Flask app"
- **Requests**: "GET /marketplace.html HTTP/1.1" 200
- **Errores**: "Error: no such table"

## Problemas Comunes

### 1. "ModuleNotFoundError: No module named 'flask'"
**Solución**: Instalar Flask
```bash
python -m pip install flask flask-cors
```

### 2. "No se puede conectar a localhost:3000"
**Solución**: Asegurarse de que el servidor está corriendo
```bash
python -m flask --app=server_orders run --port=3000
```

### 3. Tabla de pedidos no existe
**Solución**: La tabla se crea automáticamente en el primer request. Si persiste:
```bash
rm pedidos.db  # Borrar BD
# Reiniciar servidor
```

## Estructura de Carpetas Recomendada

```
OrigenBahiaTienda/
├── index.html
├── marketplace.html
├── styles.css
├── script.js
├── server_orders.py       # Nuevo
├── start_server.bat       # Nuevo (Windows)
├── test_order.py          # Para testing
├── pedidos.db             # Se crea automáticamente
└── credentials.json       # Para Google Sheets (opcional)
```

## Proximos Pasos

1. **Producción**: Desplegar servidor en host externo
2. **Admin Panel**: Crear panel para ver/editar pedidos
3. **Email**: Enviar confirmaciones por email
4. **Pagos**: Integrar Mercado Pago completo
5. **Notificaciones**: SMS o push notifications

---

**Versión**: 1.0  
**Última actualización**: 2026-06-11  
**Autor**: Origen Bahía Dev Team
