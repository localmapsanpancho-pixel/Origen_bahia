# 📋 Sincronización de Productos - Google Sheets a script.js

Sistema automatizado para actualizar productos desde una hoja de cálculo de Google Sheets.

## 🚀 Instalación Rápida

### Paso 1: Instalar Node.js
```powershell
# Verifica si está instalado
node --version

# Si no lo tienes, descárgalo desde: https://nodejs.org/
```

### Paso 2: Instalar dependencias
```powershell
cd C:\Users\PC GAMER PRO\OrigenBahiaTienda
npm install
```

### Paso 3: Configurar Google Sheets API

#### 3.1 Crear proyecto en Google Cloud
1. Ve a: https://console.cloud.google.com/
2. Clic en el selector de proyectos (arriba a la izquierda)
3. Clic en "NUEVO PROYECTO"
4. Nombre: `Origen Bahia Sync`
5. Clic en "CREAR"

#### 3.2 Habilitar Google Sheets API
1. Ve a: https://console.cloud.google.com/apis/library
2. Busca "Google Sheets API"
3. Clic en ella
4. Clic en "HABILITAR"

#### 3.3 Crear Service Account
1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Clic en "CREAR CUENTA DE SERVICIO"
3. Nombre: `origen-bahia-sync`
4. Clic en "CREAR Y CONTINUAR"
5. Clic en "CONTINUAR"
6. Clic en "CREAR CLAVE"
7. Selecciona "JSON"
8. Clic en "CREAR"

Se descargará un archivo JSON. **Cópialo a tu carpeta del proyecto** con el nombre:
```
credentials.json
```

#### 3.4 Crear y compartir Google Sheets
1. Ve a: https://sheets.google.com/
2. Crea una nueva hoja llamada "Productos"
3. Encabezados (primera fila):
   ```
   id | name | category | producer | organic | price
   ```
4. Agrega tus productos como filas
5. En la URL, copia el ID: `https://docs.google.com/spreadsheets/d/[ESTE_ES_TU_ID]/...`
6. Clic en "COMPARTIR"
7. Copia el correo de la Service Account (está en credentials.json) y comparte la hoja con permiso de editor

### Paso 4: Configurar las variables

Abre una terminal PowerShell y establece la variable de entorno:

```powershell
# Windows - Permanente (en PowerShell Admin)
[Environment]::SetEnvironmentVariable("GOOGLE_SHEETS_ID", "TU_ID_AQUI", "User")

# O temporal (sesión actual)
$env:GOOGLE_SHEETS_ID = "TU_ID_AQUI"
```

## 📝 Formato del Google Sheets

Tu hoja debe tener esta estructura:

| id | name | category | producer | organic | price |
|----|------|----------|----------|---------|-------|
| 1 | Lechuga orgánica | verduras | Rancho El Pescador | orgánico | 42 |
| 2 | Tomate cherry | verduras | Huerto Bahía | orgánico | 38 |
| 3 | Mango Ataulfo | frutas | Huerto Bahía | orgánico | 56 |
| 4 | Plátano macho | frutas | Rancho El Pescador | no orgánico | 28 |

**Categorías válidas:**
- verduras
- frutas
- lacteos
- artesanal

**Distintivo:**
- orgánico
- no orgánico

## 🔄 Usar el Script

### Opción 1️⃣: Sincronización desde Google Sheets (RECOMENDADO)

Ideal si tienes muchos productos y quieres actualizarlos desde una hoja compartida.

#### Una sola vez:
```powershell
npm run sync
```

#### Automática (cada 5 minutos):
```powershell
npm run sync:watch
```

Salida esperada:
```
✅ Se obtuvieron 8 productos
✅ Archivo guardado: script.js
✨ Sincronización completada exitosamente

📊 Resumen:
   - Productos: 8
   - Archivo: script.js
   - Timestamp: 10/06/2026 14:32:15
```

---

### Opción 2️⃣: Sincronización Manual (SIMPLE)

Ideal si tienes pocos productos o prefieres editarlos localmente.

#### Editar productos:
1. Abre el archivo: **`productos-manual.json`**
2. Modifica los productos con este formato:
```json
[
  {
    "id": 1,
    "name": "Lechuga orgánica",
    "category": "verduras",
    "producer": "Rancho El Pescador",
    "organic": "orgánico",
    "price": 42
  }
]
```

#### Sincronizar una sola vez:
```powershell
npm run sync:manual
```

#### Automática (vigila cambios en el JSON):
```powershell
npm run sync:manual:watch
```

Salida esperada:
```
✅ Se cargaron 8 productos
✅ Archivo guardado: script.js
✨ Sincronización manual completada exitosamente

📊 Resumen:
   - Productos: 8
   - Archivo: script.js
   - Timestamp: 10/06/2026 14:32:15
   
💡 Tip: Edita productos-manual.json y ejecuta nuevamente
```

---

### 📋 Comparativa: Google Sheets vs Manual

| Feature | Google Sheets | Manual |
|---------|---------------|--------|
| **Facilidad** | Requiere config inicial | Plug & play |
| **Escalabilidad** | Ideal para +50 productos | Ideal para <50 productos |
| **Colaboración** | ✅ Múltiples usuarios | ❌ Un archivo local |
| **Actualizaciones** | Automáticas | Manual |
| **Seguridad** | Requiere credenciales | Ninguno |
| **Ideal para** | Tiendas profesionales | Pruebas/desarrollo |

## 🔧 Solucionar Problemas

### Google Sheets

#### ❌ "credentials.json no se encontró"
- Verifica que descargaste el JSON de la Service Account
- Nombralo exactamente: `credentials.json`
- Colócalo en la misma carpeta que `sync-products.js`

#### ❌ "La hoja 'Productos' no existe"
- Crea una hoja llamada exactamente `Productos`
- Verifica que tiene los encabezados correctos

#### ❌ "Error de permisos"
- Comparte el Google Sheets con el correo de la Service Account
- El correo está en `credentials.json` (campo `client_email`)

#### ❌ "GOOGLE_SHEETS_ID no definido"
- Establece la variable de entorno con tu ID de Sheets
- O edita `sync-products.js` y reemplaza `TU_SPREADSHEET_ID_AQUI`

### Carga Manual

#### ❌ "productos-manual.json no se encontró"
- Verifica que el archivo existe en la carpeta principal
- Debe llamarse exactamente: `productos-manual.json`

#### ❌ "Error en el JSON"
- Valida que el JSON sea correcto (sin comas faltantes o extras)
- Usa un validador online: https://jsonlint.com/

#### ❌ "Producto incompleto"
- Cada producto debe tener: id, name, category, producer, organic, price
- Ejemplo correcto:
```json
{
  "id": 1,
  "name": "Tomate",
  "category": "verduras",
  "producer": "Huerto Bahía",
  "organic": "orgánico",
  "price": 38
}
```

## 📊 Resultado

El script genera automáticamente un `script.js` actualizado con:
- ✅ Todos los productos del Sheets
- ✅ Filtros funcionales
- ✅ Carrito de compra
- ✅ Punto de venta
- ✅ Toda la funcionalidad del sitio

## 🔐 Seguridad

- Nunca compartas el archivo `credentials.json` en público
- Agrega `credentials.json` a `.gitignore`:
  ```
  credentials.json
  node_modules/
  ```

## � Estructura del Proyecto

```
OrigenBahiaTienda/
├── index.html                  # Página principal
├── marketplace.html            # Página de tienda
├── styles.css                  # Estilos
├── script.js                   # Lógica (GENERADO AUTOMÁTICAMENTE)
├── package.json                # Configuración npm
│
├── sync-products.js            # Script de Google Sheets
├── credentials.json            # Credenciales de Google (NO COMPARTIR)
├── credentials-example.json    # Ejemplo de estructura
│
├── sync-manual.js              # Script de carga manual
├── productos-manual.json       # Productos locales (editable)
│
├── SETUP.md                    # Este archivo
└── .gitignore                  # Archivos a ignorar en Git
```

## 🚦 Flujo Recomendado

### Para desarrollo/pruebas:
```powershell
# Usar productos locales
npm run sync:manual

# Vigila cambios automáticos
npm run sync:manual:watch
```

### Para producción:
```powershell
# Usar Google Sheets
npm run sync

# Vigila cambios automáticos
npm run sync:watch
```

## 📞 Soporte

Si tienes problemas:
1. Verifica que todos los pasos están completos
2. Revisa que los nombres coincidan exactamente (mayúsculas/minúsculas)
3. Valida JSON: https://jsonlint.com/
4. Limpia y reinicia:
   ```powershell
   Remove-Item script.js
   npm run sync:manual  # o sync
   ```

---

¡Listo! Tu tienda ahora tiene dos opciones para actualizar productos 🎉

**¿Necesitas ayuda?** Elige una opción:
- **Google Sheets** → Ideal para trabajo colaborativo
- **Manual** → Ideal para desarrollo rápido
