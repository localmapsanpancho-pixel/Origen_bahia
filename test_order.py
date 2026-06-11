#!/usr/bin/env python3
"""Script de prueba para enviar pedido al servidor"""
import requests
import json

url = 'http://localhost:3000/submit_order'
data = {
    'nombre': 'Juan López',
    'direccion': 'Av. Principal 456, Bahía de Banderas',
    'hora': '14:30',
    'cart': {'1': 2, '3': 1, '5': 1},
    'total': 196.0
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
