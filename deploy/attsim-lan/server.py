"""Serve the built IFView app on the 2502 LAN using the existing runtime image."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.send_response(302)
            # Fragments are not sent in HTTP requests. Use a different path so
            # following the redirect does not request "/" again.
            self.send_header("Location", "/index.html#/attsim?experiment=attsim-lan")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8080), partial(Handler, directory="/site")).serve_forever()
