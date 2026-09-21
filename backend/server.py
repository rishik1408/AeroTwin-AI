"""
AeroTwin Engine Control UI Server
Zero external dependencies — uses only Python stdlib + simulation modules.
Run from project root: python backend/server.py
Then open http://localhost:8765 in your browser.
"""
import sys, os, json, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

# Allow importing simulation modules from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'simulation')))
from engine_model import EngineState
from faults import FaultInjector

# ── Shared engine state ──────────────────────────────────────────────────────
engine = EngineState()
injector = FaultInjector(engine)

# NOTE: is_running starts False to match EngineState.__init__ default.
# The UI sends is_running=true on load to start the engine.
controls = {
    "throttle": 0.0,
    "altitude": 0.0,
    "ambient_temp": 15.0,
    "is_running": False,
    "airspeed_kts": 0.0,
}

# One step of telemetry is computed each time GET /telemetry is called
last_telemetry = {}
last_labels = []
_lock = threading.Lock()

def step_engine():
    global last_telemetry, last_labels
    with _lock:
        t, labels = injector.step(
            throttle_position=controls["throttle"],
            altitude_m=controls["altitude"],
            ambient_temp_celsius=controls["ambient_temp"],
            is_running=controls["is_running"],
            airspeed_kts=controls["airspeed_kts"],
        )
        last_telemetry = t.__dict__
        last_labels = [l.__dict__ for l in labels]


def reset_simulation():
    global engine, injector
    with _lock:
        engine = EngineState()
        injector = FaultInjector(engine)
        controls["throttle"] = 0.0
        controls["altitude"] = 0.0
        controls["ambient_temp"] = 15.0
        controls["is_running"] = True


# ── HTTP Request handler ─────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # silence per-request logs

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html):
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/" or path == "/index.html":
            html_path = os.path.join(os.path.dirname(__file__), "ui.html")
            with open(html_path, "r") as f:
                self._send_html(f.read())
        elif path == "/telemetry":
            step_engine()
            self._send_json({"telemetry": last_telemetry, "labels": last_labels, "controls": controls})
        elif path == "/isa_temp":
            from urllib.parse import parse_qs
            qs = parse_qs(urlparse(self.path).query)
            alt = float(qs.get("altitude", ["0"])[0])
            from engine_model import isa_temperature, density_ratio
            isa_t = isa_temperature(alt)
            sigma = density_ratio(alt, isa_t)
            self._send_json({"isa_temp_celsius": round(isa_t, 1), "density_ratio": round(sigma, 4)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_body()
        if path == "/controls":
            with _lock:
                controls["throttle"] = float(body.get("throttle", 0))
                controls["altitude"] = float(body.get("altitude", 0))
                controls["ambient_temp"] = float(body.get("ambient_temp", 15))
                controls["airspeed_kts"] = float(body.get("airspeed_kts", 0))
                raw = body.get("is_running", False)
                controls["is_running"] = raw is True or raw == 1
            self._send_json({"status": "ok", "is_running": controls["is_running"]})
        elif path == "/faults":
            with _lock:
                injector.trigger_fault(
                    fault_type=body["fault_type"],
                    severity=float(body.get("severity", 0.5)),
                    duration_seconds=int(body.get("duration", 10)),
                )
            self._send_json({"status": "ok"})
        elif path == "/reset":
            reset_simulation()
            self._send_json({"status": "reset"})
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    port = 8765
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"\n  AeroTwin UI  →  http://localhost:{port}\n  Press Ctrl-C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
