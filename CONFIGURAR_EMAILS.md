# Configuracion de Emails - Guia Paso a Paso

## Como Habilitar Notificaciones de Pedidos por Email

Tu sistema ahora envia emails automaticos a:
- **Clientes**: Confirmacion de pedido (si proporcionan email)
- **Admin**: Notificacion de nuevo pedido a bahiaorigen@gmail.com

---

## Pasos para Configurar Gmail

### 1. Habilitar Autenticacion de 2 Factores en Google

1. Ve a: https://myaccount.google.com/
2. Haz clic en "Seguridad" (en el panel izquierdo)
3. Busca "Verificacion en 2 pasos"
4. Sigue los pasos para habilitar 2FA

### 2. Crear Contraseña de Aplicacion

1. Despues de habilitar 2FA, ve a: https://myaccount.google.com/
2. Haz clic en "Seguridad"
3. En la parte inferior, encontraras "Contrasenas de aplicacion" (solo aparece si 2FA esta activo)
4. Selecciona:
   - Aplicacion: **Correo**
   - Dispositivo: **Windows/Mac/Linux**
5. Google te generara una contraseña de 16 caracteres
6. **Copia esta contraseña** (sin espacios)

### 3. Configurar Variables de Entorno

Edita el archivo `.env` en la carpeta del proyecto:

```env
# Configuracion de Email - Gmail
SMTP_EMAIL=bahiaorigen@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

**Reemplaza** `xxxx xxxx xxxx xxxx` con la contraseña generada por Google (sin espacios).

Ejemplo:
```env
SMTP_EMAIL=bahiaorigen@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### 4. Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C en la terminal)

# Volver a iniciar
python -m flask --app=server_orders run --port=3000
```

---

## Estructura de Emails

### Email al Cliente
- **De**: bahiaorigen@gmail.com
- **Para**: Email del cliente (si lo proporciona)
- **Asunto**: Confirmacion de Pedido #[ID]
- **Contenido**:
  - Numero de pedido
  - Fecha y hora
  - Productos ordenados
  - Total del pedido
  - Direccion de entrega
  - Hora solicitada

### Email al Admin
- **De**: bahiaorigen@gmail.com
- **Para**: bahiaorigen@gmail.com
- **Asunto**: Nuevo Pedido #[ID] - [Nombre Cliente]
- **Contenido**:
  - Detalles del cliente
  - Todos los productos
  - Total del pedido
  - Instrucciones de entrega

---

## Troubleshooting

### Error: "Error enviando email: ..."

**Causa**: La contraseña es incorrecta o 2FA no esta habilitado

**Solucion**:
1. Verifica que 2FA este activo en tu cuenta Google
2. Regenera una nueva contraseña de aplicacion
3. Actualiza el archivo `.env`
4. Reinicia el servidor

### Los emails no llegan

**Causas posibles**:
1. SMTP_PASSWORD no esta configurado (revisa .env)
2. Gmail esta bloqueando la conexion (habilita "Aplicaciones menos seguras")
3. El email del cliente es invalido

**Solucion**:
1. Verifica el archivo `.env`
2. Prueba enviando un email de prueba
3. Revisa la carpeta de spam/correo no deseado del cliente

### "Connection refused"

**Causa**: El servidor no esta corriendo

**Solucion**:
```bash
python -m flask --app=server_orders run --port=3000
```

---

## Datos Recopilados

El sistema ahora guarda en la base de datos:
- Nombre del cliente
- **Email del cliente** (NUEVO)
- Direccion de entrega
- Hora preferida
- Productos
- Total
- Fecha y hora del pedido
- Estado del pedido

---

## Mejoras Futuras

- [ ] Panel para ver historial de emails enviados
- [ ] Templates personalizados de email
- [ ] Reenvio de confirmacion de pedido
- [ ] Notificaciones SMS
- [ ] Cambio de estado de pedido (en preparacion, en ruta, etc)

---

## Comandos Rapidos

```bash
# Ver pedidos (incluye emails)
python query_orders.py

# Prueba de configuracion
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(f'Email: {os.getenv(\"SMTP_EMAIL\")}')"

# Reiniciar servidor con emails
python -m flask --app=server_orders run --port=3000
```

---

**Nota**: Los archivos `.env` y `credentials.json` NO deben ser compartidos en Git. Verifica que esten en `.gitignore`.
