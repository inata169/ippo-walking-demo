"""一歩ずつ v0.2 レビュー版をローカルで開きます。"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import threading
import webbrowser


ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)


class DemoHandler(SimpleHTTPRequestHandler):
    """Serve ES modules with stable MIME types on Windows."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


server = ThreadingHTTPServer(("127.0.0.1", 0), DemoHandler)
url = f"http://127.0.0.1:{server.server_port}/review/v0.2/"


def open_page():
    webbrowser.open(url)


print(f"一歩ずつ v0.2 を開きます: {url}")
print("終了するときは、この画面で Ctrl+C を押してください。")
threading.Timer(0.4, open_page).start()

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\n終了しました。")
finally:
    server.server_close()
