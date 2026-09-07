"""一歩ずつ v0.3。Python 3標準ライブラリのみ、PC自身からのみアクセス可。"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent


class DemoHandler(SimpleHTTPRequestHandler):
    # Do not inherit Windows registry MIME types for ES modules.
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


def main():
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(DemoHandler, directory=str(ROOT)))
    url = f"http://127.0.0.1:{server.server_port}/review/v0.3/"
    print(f"一歩ずつ v0.3 を開きます: {url}", flush=True)
    print("使用中はこの画面を開いたままにしてください。終了は Ctrl+C です。")
    timer = threading.Timer(0.4, lambda: webbrowser.open(url))
    timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        timer.cancel()
        server.server_close()


if __name__ == "__main__":
    main()
