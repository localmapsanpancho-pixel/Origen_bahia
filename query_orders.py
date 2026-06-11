#!/usr/bin/env python3
"""
Script para consultar pedidos guardados en SQLite (con emails)
"""
import sqlite3
import json
from datetime import datetime

db_path = 'pedidos.db'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Contar total de pedidos
    c.execute('SELECT COUNT(*) as total FROM pedidos')
    total = c.fetchone()['total']
    
    print("=" * 80)
    print(f"RESUMEN DE PEDIDOS - Total: {total}")
    print("=" * 80)
    
    if total == 0:
        print("No hay pedidos aun.")
    else:
        # Obtener todos los pedidos ordenados por fecha descendente
        c.execute('''SELECT * FROM pedidos ORDER BY fecha DESC''')
        rows = c.fetchall()
        
        for idx, row in enumerate(rows, 1):
            cart = json.loads(row['productos'])
            productos_str = ", ".join([f"Producto {k}({v}u)" for k, v in cart.items()])
            
            email_cliente = row['email'] if row['email'] else "Sin proporcionar"
            
            print(f"\n[{idx}] Pedido #{row['id']} - {row['estado'].upper()}")
            print(f"    Cliente: {row['nombre']}")
            print(f"    Email: {email_cliente}")
            print(f"    Entrega: {row['direccion']}")
            print(f"    Hora: {row['hora_entrega']}")
            print(f"    Productos: {productos_str}")
            print(f"    Total: ${row['total']:.2f}")
            print(f"    Fecha: {row['fecha']}")
    
    conn.close()
    
except FileNotFoundError:
    print("Error: Base de datos 'pedidos.db' no encontrada.")
    print("Por favor, inicia el servidor primero:")
    print("  python -m flask --app=server_orders run --port=3000")
except Exception as e:
    print(f"Error: {e}")
