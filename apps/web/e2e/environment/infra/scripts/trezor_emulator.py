"""Runs the emulated Trezor of the Trezor specs and lets them read its screen and press Confirm over HTTP.

Uses the modules of the trezor-user-env image to start Trezor Bridge and a wiped emulator with the test seed. It does
not run the image's controller: that controller pings the emulator's main interface before each command, and the
emulator then sends its next message to the controller instead of to the Bridge, which drops a review in progress.
This server reaches the device through its debug interface only.
"""

import argparse
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

# binaries, bridge and emulator are the image's modules; Compose puts their folder on PYTHONPATH
import binaries
import bridge
import emulator
from trezorlib.debuglink import DebugLink
from trezorlib.transport.udp import UdpTransport

PORT = 9001
DEBUG_INTERFACE = "127.0.0.1:21325"


def start_device():
    binaries.explore(argparse.Namespace(verbosity=0))
    bridge.start(binaries.DEFAULT_BRIDGE)
    emulator.start(os.environ["TREZOR_FIRMWARE"], os.environ["TREZOR_MODEL"], wipe=True, save_screenshots=True)
    emulator.setup_device(os.environ["TREZOR_SEED"], "", False, os.environ["TREZOR_LABEL"])


def with_debuglink(action):
    link = DebugLink(UdpTransport(DEBUG_INTERFACE))
    try:
        return action(link)
    finally:
        link.close()


def read_screen():
    layout = with_debuglink(lambda link: link.read_layout())
    return {"title": layout.title(), "body": layout.text_content()}


def press_yes():
    with_debuglink(lambda link: link.press_yes())
    return {}


def screenshot():
    return {"png": emulator.get_current_screen()}


ROUTES = {("GET", "/screen"): read_screen, ("POST", "/press-yes"): press_yes, ("GET", "/screenshot"): screenshot}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")

    def route(self, method):
        action = ROUTES.get((method, self.path))
        if action is None:
            self.send_error(404)
            return
        try:
            body = json.dumps(action()).encode()
            self.send_response(200)
        except Exception as error:  # Report every device failure to the spec instead of dropping the request
            body = json.dumps({"error": repr(error)}).encode()
            self.send_response(500)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    os.chdir("/trezor-user-env")
    start_device()
    print(f"Trezor emulator ready on port {PORT}", flush=True)
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
