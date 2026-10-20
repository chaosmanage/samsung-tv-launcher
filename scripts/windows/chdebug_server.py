import http.server, os, time
LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chdebug.log")
CMD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chdebug-cmd.txt")
class H(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def _send(self, code, body=b''):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if body: self.wfile.write(body)
    def do_OPTIONS(self): self._send(204)
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n).decode('utf-8', 'replace')
        with open(LOG, 'a', encoding='utf-8') as f: f.write(time.strftime('%H:%M:%S ') + body + '\n')
        self._send(200)
    def do_GET(self):
        c = ''
        if os.path.exists(CMD):
            c = open(CMD, encoding='utf-8-sig').read().strip(); os.remove(CMD)
            with open(LOG, 'a', encoding='utf-8') as f: f.write(time.strftime('%H:%M:%S ') + '{"evt":"cmd-served","cmd":"%s"}\n' % c)
        self._send(200, c.encode())
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('0.0.0.0', 8765), H).serve_forever()
