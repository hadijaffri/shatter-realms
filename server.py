#!/usr/bin/env python3
import http.server
import json
import os

PORT = 8000
DATA_FILE = 'playerdata.json'

# Initialize data file if it doesn't exist
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump({'coins': 100, 'ownedItems': ['sword', 'fireball']}, f)

class GameHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/save' or self.path == '/api/coins':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with open(DATA_FILE, 'r') as f:
                self.wfile.write(f.read().encode())
        elif self.path == '/':
            self.path = '/shatterrealms_v5.html'
            super().do_GET()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/save' or self.path == '/api/coins':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode())
                save_data = {
                    'coins': data.get('coins', 100),
                    'ownedItems': data.get('ownedItems', ['sword', 'fireball'])
                }
                with open(DATA_FILE, 'w') as f:
                    json.dump(save_data, f)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, **save_data}).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), GameHandler) as httpd:
        print(f'Server running at http://localhost:{PORT}/')
        print(f'Game: http://localhost:{PORT}/shatterrealms_v5.html')
        httpd.serve_forever()
