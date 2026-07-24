# 📋 Reporte de Pedidos Pendientes - Origen Bahía

## Estado Actual

### ✅ **Situación**
- **Pedidos en SQLite (local)**: 9 pedidos pendientes
- **Pedidos en Google Sheets**: ❌ No sincronizados

### 📊 **Pedidos Pendientes**

| # | Cliente | Email | Total | Fecha |
|---|---------|-------|-------|-------|
| 1 | Carlos Lopez | Sin proporcionar | $225.50 | 2026-06-11 09:57:15 |
| 2 | Ana Martinez | Sin proporcionar | $145.00 | 2026-06-11 09:57:29 |
| 3 | Jorge Rodriguez | Sin proporcionar | $280.75 | 2026-06-11 09:57:31 |
| 4 | Juan López | Sin proporcionar | $196.00 | 2026-06-11 10:01:17 |
| 5 | carlos | Sin proporcionar | $91.00 | 2026-06-11 10:19:11 |
| 6 | carlos | cflsdesign@gmail.com | $91.00 | 2026-06-12 21:55:12 |
| 7 | Test | test@example.com | $123.45 | 2026-06-12 23:01:47 |
| 8 | Pedido Prueba Sheets | test-sheets@origenbahia.com | $189.00 | 2026-06-12 23:29:20 |
| 9 | Test Cliente | test-cliente@origenbahia.test | $200.00 | 2026-07-07 08:58:47 |

**Total acumulado**: $1,532.65

---

## 🔧 Solución: Sincronización Manual

Hay un problema con la conectividad a Google Sheets. Para sincronizar estos pedidos, sigue estos pasos:

### Opción 1: Usar el script automático (si se resuelve el acceso a Google Sheets)
```bash
node sync-pending-orders.js
```

### Opción 2: Sincronización manual via Google Sheets API
1. Asegúrate de que:
   - La cuenta de servicio en `credentials.json` tiene acceso al documento
   - El ID del documento es correcto: `1V_RHLYkOcg3WUxITmgOUZILHN2NB987vOCWOPrKroo4`
   - La API de Google Sheets está habilitada en Google Cloud

2. Verifica la configuración:
   ```bash
   cat .env | findstr GOOGLE
   ```

3. Para ver los pedidos en la BD:
   ```bash
   python query_orders.py
   ```

---

## 📱 Datos a Sincronizar (JSON para importación manual)

```json
[
  {
    "ID": 1,
    "Nombre": "Carlos Lopez",
    "Email": "",
    "Telefono": "",
    "Dirección": "Avenida Central 789",
    "Hora": "15:00",
    "Productos": "Producto 1(1u), Producto 2(3u), Producto 4(2u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 225.50,
    "Fecha": "2026-06-11 09:57:15"
  },
  {
    "ID": 2,
    "Nombre": "Ana Martinez",
    "Email": "",
    "Telefono": "",
    "Dirección": "Calle 5 de Mayo 321",
    "Hora": "16:00",
    "Productos": "Producto 3(2u), Producto 6(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 145.00,
    "Fecha": "2026-06-11 09:57:29"
  },
  {
    "ID": 3,
    "Nombre": "Jorge Rodriguez",
    "Email": "",
    "Telefono": "",
    "Dirección": "Boulevard Costero 999",
    "Hora": "17:30",
    "Productos": "Producto 2(1u), Producto 5(2u), Producto 7(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 280.75,
    "Fecha": "2026-06-11 09:57:31"
  },
  {
    "ID": 4,
    "Nombre": "Juan López",
    "Email": "",
    "Telefono": "",
    "Dirección": "Av. Principal 456, Bahía de Banderas",
    "Hora": "14:30",
    "Productos": "Producto 1(2u), Producto 3(1u), Producto 5(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 196.00,
    "Fecha": "2026-06-11 10:01:17"
  },
  {
    "ID": 5,
    "Nombre": "carlos",
    "Email": "",
    "Telefono": "",
    "Dirección": "peten 67",
    "Hora": "hoy 12",
    "Productos": "Producto 1(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 91.00,
    "Fecha": "2026-06-11 10:19:11"
  },
  {
    "ID": 6,
    "Nombre": "carlos",
    "Email": "cflsdesign@gmail.com",
    "Telefono": "",
    "Dirección": "p",
    "Hora": "12",
    "Productos": "Producto 1(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 91.00,
    "Fecha": "2026-06-12 21:55:12"
  },
  {
    "ID": 7,
    "Nombre": "Test",
    "Email": "test@example.com",
    "Telefono": "",
    "Dirección": "Calle Prueba",
    "Hora": "14:00",
    "Productos": "Producto 1(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 123.45,
    "Fecha": "2026-06-12 23:01:47"
  },
  {
    "ID": 8,
    "Nombre": "Pedido Prueba Sheets",
    "Email": "test-sheets@origenbahia.com",
    "Telefono": "",
    "Dirección": "Av. Prueba 123",
    "Hora": "18:30",
    "Productos": "Producto 1(2u), Producto 3(1u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 189.00,
    "Fecha": "2026-06-12 23:29:20"
  },
  {
    "ID": 9,
    "Nombre": "Test Cliente",
    "Email": "test-cliente@origenbahia.test",
    "Telefono": "",
    "Dirección": "Av. Prueba 123",
    "Hora": "Mañana 10-12",
    "Productos": "Producto ob_apple(2u)",
    "Metodo Pago": "No especificado",
    "Subtotal": null,
    "Envio": null,
    "Total": 200.00,
    "Fecha": "2026-07-07 08:58:47"
  }
]
```

---

## ⚠️ Próximas Acciones Recomendadas

1. **Verificar acceso a Google Sheets** - Confirmar que `credentials.json` es válido
2. **Sincronizar los 9 pedidos pendientes** - Una vez se resuelva el acceso
3. **Implementar sincronización automática** - El servidor.js ya intenta hacer esto para pedidos nuevos
4. **Marcar como "sincronizado"** - Para evitar duplicados en futuras sincronizaciones

---

**Generado**: 2026-07-24
**Script**: sync-pending-orders.js
