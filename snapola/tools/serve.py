#!/usr/bin/env python3
"""Tiny static server for local development.

Identical in spirit to `python -m http.server`, but sends `Cache-Control:
no-store` so edited ES modules are always re-fetched (the default server lets the
browser memory-cache modules across reloads, which hides edits during dev). It
also serves `.mjs`/`.js` as `text/javascript`. Production is plain static files
behind nginx; this script is dev-only.
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8781
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
