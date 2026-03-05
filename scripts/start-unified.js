const { spawn } = require("node:child_process");
const path = require("node:path");

console.log("🚀 Starting The Spatial Eye Unified Service...");

const startBackend = () => {
  console.log("🐍 Starting Python Relay Backend on 0.0.0.0:8000...");
  const python = spawn(
    "uv",
    ["run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
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

  python.on("error", (err) =>
    console.error("❌ Failed to start Python backend process:", err),
  );
  python.on("close", (code) =>
    console.log(`🐍 Python backend exited with code ${code}`),
  );
};

const startFrontend = () => {
  console.log("⚛️ Starting Next.js Frontend...");
  // Next.js standalone server
  const next = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3000" },
  });

  next.on("error", (err) =>
    console.error("❌ Failed to start Next.js frontend:", err),
  );
  next.on("close", (code) =>
    console.log(`⚛️ Next.js frontend exited with code ${code}`),
  );
};

// Start both!
startBackend();
startFrontend();
