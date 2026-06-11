#!/usr/bin/env python3
"""
Servidor Flask para guardar pedidos en SQLite y enviar notificaciones por email
"""
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Intentar importar google-sheets
try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("Nota: google-auth no instalado.")

app = Flask(__name__, static_folder='.')
CORS(app)

# Configuración
DB_PATH = 'pedidos.db'
SHEETS_ID = os.getenv('GOOGLE_SHEETS_ID', '')
SMTP_EMAIL = os.getenv('SMTP_EMAIL', 'bahiaorigen@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))

@app.before_request
def initialize_db():
    if not hasattr(app, 'db_initialized'):
        init_db()
        app.db_initialized = True

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT,
            direccion TEXT NOT NULL,
            hora_entrega TEXT NOT NULL,
            productos TEXT NOT NULL,
            total REAL NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            estado TEXT DEFAULT 'pendiente'
        )
    ''')
    conn.commit()
    conn.close()
    print("Base de datos lista")

def send_email_notification(pedido_id, nombre, email_cliente, direccion, hora, productos, total):
    if not SMTP_PASSWORD:
        print("Email no configurado. Saltando notificacion.")
        return False
    
    try:
        if isinstance(productos, str):
            productos_dict = json.loads(productos)
        else:
            productos_dict = productos
            
        productos_html = "<ul>"
        for prod_id, cantidad in productos_dict.items():
            productos_html += f"<li>Producto {prod_id}: {cantidad} unidades</li>"
        productos_html += "</ul>"
        
        html_cliente = f"""
        <html><body style="font-family: Arial; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
                <h2 style="color: #2c5f2d; border-bottom: 3px solid #2c5f2d; padding-bottom: 10px;">Confirmacion de Pedido</h2>
                <p>Hola <strong>{nombre}</strong>,</p>
                <p>Tu pedido ha sido recibido:</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
                    <p><strong>Numero:</strong> #{pedido_id}</p>
                    <p><strong>Fecha:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                    <p><strong>Entrega:</strong> {hora}</p>
                    <p><strong>Direccion:</strong> {direccion}</p>
                    <p><strong>Total:</strong> ${total:.2f}</p>
                </div>
                <h3 style="color: #2c5f2d;">Productos:</h3>
                {productos_html}
                <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #666; font-size: 14px;">Gracias por comprar en Origen Bahia</p>
            </div>
        </body></html>
        """
        
        html_admin = f"""
        <html><body style="font-family: Arial; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
                <h2 style="color: #d9534f; border-bottom: 3px solid #d9534f; padding-bottom: 10px;">Nuevo Pedido</h2>
                <p><strong>ID:</strong> #{pedido_id}</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
                    <p><strong>Cliente:</strong> {nombre}</p>
                    <p><strong>Email:</strong> {email_cliente or 'Sin email'}</p>
                    <p><strong>Direccion:</strong> {direccion}</p>
                    <p><strong>Hora:</strong> {hora}</p>
                    <p><strong>Total:</strong> ${total:.2f}</p>
                </div>
                <h3 style="color: #d9534f;">Productos:</h3>
                {productos_html}
            </div>
        </body></html>
        """
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        
        if email_cliente:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Pedido #{pedido_id} Confirmado'
            msg['From'] = SMTP_EMAIL
            msg['To'] = email_cliente
            msg.attach(MIMEText(html_cliente, 'html'))
            server.send_message(msg)
            print(f"Email al cliente: {email_cliente}")
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Nuevo Pedido #{pedido_id} - {nombre}'
        msg['From'] = SMTP_EMAIL
        msg['To'] = SMTP_EMAIL
        msg.attach(MIMEText(html_admin, 'html'))
        server.send_message(msg)
        print(f"Email al admin")
        
        server.quit()
        return True
        
    except Exception as e:
        print(f"Error email: {e}")
        return False

def save_to_sheets(pedido_id, nombre, direccion, hora, productos, total):
    if not GOOGLE_AVAILABLE or not SHEETS_ID:
        return False
    
    try:
        creds = Credentials.from_service_account_file('credentials.json')
        service = build('sheets', 'v4', credentials=creds)
        
        prod_str = '; '.join([f"Prod {k} ({v}u)" for k, v in productos.items()])
        fecha = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        values = [[pedido_id, nombre, direccion, hora, prod_str, total, fecha]]
        body = {'values': values}
        
        service.spreadsheets().values().append(
            spreadsheetId=SHEETS_ID,
            range='Pedidos!A:G',
            valueInputOption='USER_ENTERED',
            body=body
        ).execute()
        
        print(f"Guardado en Sheets")
        return True
    except Exception as e:
        print(f"Error Sheets: {e}")
        return False

@app.route('/submit_order', methods=['POST'])
def submit_order():
    try:
        data = request.get_json()
        nombre = data.get('nombre', '').strip()
        email = data.get('email', '').strip()
        direccion = data.get('direccion', '').strip()
        hora = data.get('hora', '').strip()
        cart = data.get('cart', {})
        total = data.get('total', 0)

        if not all([nombre, direccion, hora, cart]):
            return jsonify({'error': 'Datos incompletos'}), 400

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO pedidos (nombre, email, direccion, hora_entrega, productos, total)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (nombre, email, direccion, hora, json.dumps(cart), total))
        conn.commit()
        
        pedido_id = c.lastrowid
        conn.close()
        
        print(f"Pedido #{pedido_id} guardado")

        save_to_sheets(pedido_id, nombre, direccion, hora, cart, total)
        send_email_notification(pedido_id, nombre, email, direccion, hora, json.dumps(cart), total)

        return jsonify({
            'success': True,
            'pedidoId': pedido_id,
            'mensaje': f'Pedido #{pedido_id} registrado. Revisa tu email.'
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    init_db()
    port = int(os.getenv('PORT', 3000))
    print(f"Servidor en http://localhost:{port}")
    app.run(debug=True, port=port, host='0.0.0.0')
