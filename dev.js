import { spawn, execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

// Perbaiki PATH jika C:\Windows\System32 hilang dari environment
const sys32 = "C:\\Windows\\System32";
const sysRoot = process.env.SystemRoot || "C:\\Windows";
const currentPath = process.env.PATH || process.env.Path || "";

const requiredDirs = [
  sys32,
  sysRoot,
  `${sys32}\\WindowsPowerShell\\v1.0`,
];

const missingDirs = requiredDirs.filter(
  (dir) => !currentPath.toLowerCase().includes(dir.toLowerCase())
);

const fixedPath = missingDirs.length > 0 
  ? `${missingDirs.join(";")};${currentPath}` 
  : currentPath;

const env = {
  ...process.env,
  PATH: fixedPath,
  Path: fixedPath,
  ComSpec: process.env.ComSpec || `${sys32}\\cmd.exe`,
};

// Fungsi otomatis membebaskan port jika ada proses node lama yang masih menyangkut
function freePort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, { env, encoding: "utf8" });
      const lines = output.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== String(process.pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { env, stdio: "ignore" });
              console.log(`🧹 Membersihkan proses lama (PID ${pid}) pada port ${port}...`);
            } catch {}
          }
        }
      }
    }
  } catch {}
}

console.log("=======================================================");
console.log("🎮 Menjalankan Esports Server & Client...");

// Bersihkan port 3000 (server) & 5173 (client) sebelum memulai
freePort(3000);
freePort(5173);

console.log("📡 Backend : http://localhost:3000");
console.log("💻 Frontend: http://localhost:5173");
console.log("Tekan Ctrl+C untuk menghentikan kedua server.");
console.log("=======================================================\n");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const server = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(process.cwd(), "server"),
  stdio: "inherit",
  env,
  shell: true,
});

const client = spawn(npmCmd, ["run", "dev"], {
  cwd: path.resolve(process.cwd(), "client"),
  stdio: "inherit",
  env,
  shell: true,
});

function cleanup() {
  try { server.kill(); } catch {}
  try { client.kill(); } catch {}
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

server.on("error", (err) => {
  console.error("[SERVER ERROR]", err);
});

client.on("error", (err) => {
  console.error("[CLIENT ERROR]", err);
});
