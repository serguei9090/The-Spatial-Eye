const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");
const httpProxy = require("http-proxy");

console.log("🚀 Starting The Spatial Eye Unified Service Gateway...");

const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3001; // Internal Next.js port
const PUBLIC_PORT = process.env.PORT || 3000;

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
});

// Error handling to prevent proxy crashes
proxy.on("error", (err, req, res) => {
  if (res && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" });
  }
  if (res) res.end(`Bad Gateway: ${err.message}`);
});

const server = http.createServer((req, res) => {
  // Route /api and /ws and /diagnostics to the Python backend
  if (
    req.url.startsWith("/api") ||
    req.url.startsWith("/ws") ||
    req.url.startsWith("/diagnostics")
  ) {
    proxy.web(req, res, { target: `http://127.0.0.1:${BACKEND_PORT}` });
  } else {
    // Route everything else to the Next.js frontend
    proxy.web(req, res, { target: `http://127.0.0.1:${FRONTEND_PORT}` });
  }
});

// Handle WebSocket upgrades
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/ws")) {
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${BACKEND_PORT}` });
  } else {
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${FRONTEND_PORT}` });
  }
});

const startBackend = () => {
  console.log(`🐍 Starting Python Relay Backend on 127.0.0.1:${BACKEND_PORT}...`);
  const python = spawn(
    "uv",
    ["run", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", `${BACKEND_PORT}`],
    {
      cwd: path.join(__dirname, "backend"),
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, "backend"),
        PYTHONUNBUFFERED: "1",
      },
    },
  );

  python.on("error", (err) => console.error("❌ Failed to start Python backend:", err));
};

const startFrontend = () => {
  console.log(`⚛️ Starting Next.js Frontend on 127.0.0.1:${FRONTEND_PORT}...`);
  const next = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: { ...process.env, PORT: `${FRONTEND_PORT}`, HOSTNAME: "127.0.0.1" },
  });

  next.on("error", (err) => console.error("❌ Failed to start Next.js frontend:", err));
};

// Start everything!
server.listen(PUBLIC_PORT, () => {
  console.log(`🕸️  Gateway listening on port ${PUBLIC_PORT}`);
  startBackend();
  startFrontend();
});
