#!/usr/bin/env python3
"""
Dev-only HTTP server: same as `python3 -m http.server` but sends
Cache-Control: no-store on *.js, *.css, *.mjs, and *.html so the
module cache doesn't serve a stale pages.js when you edit it.

Usage:  python3 scripts/devserve.py 8000
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.rsplit('?', 1)[0].endswith(('.js', '.mjs', '.css', '.html', '/')):
            self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler) as httpd:
        print(f'dev-serve on http://127.0.0.1:{port}  (no-cache for js/css/html)')
        httpd.serve_forever()


if __name__ == '__main__':
    main()
