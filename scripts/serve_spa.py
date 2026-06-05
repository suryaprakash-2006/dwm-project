import argparse
import http.server
import os
from pathlib import Path
from socketserver import ThreadingTCPServer

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                index_path = os.path.join(path, index)
                if os.path.exists(index_path):
                    path = index_path
                    break

        if not os.path.exists(path):
            self.path = "/index.html"
            path = self.translate_path(self.path)
        return super().send_head()

    def log_message(self, format, *args):
        return


def run_server(directory: Path, host: str, port: int):
    os.chdir(directory)
    handler = SPARequestHandler
    handler.directory = str(directory)

    with ThreadingTCPServer((host, port), handler) as httpd:
        print(f"Serving SPA build at http://{host}:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


def main():
    parser = argparse.ArgumentParser(description="Serve a React SPA build directory with SPA fallback.")
    parser.add_argument("--directory", required=True, help="Path to the build directory to serve.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to.")
    parser.add_argument("--port", type=int, default=3003, help="Port to serve on.")
    args = parser.parse_args()

    build_path = Path(args.directory).resolve()
    if not build_path.exists() or not build_path.is_dir():
        raise SystemExit(f"Build directory not found: {build_path}")

    run_server(build_path, args.host, args.port)

if __name__ == "__main__":
    main()
