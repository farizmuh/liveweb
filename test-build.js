import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const sys32 = "C:\\Windows\\System32";
const sysRoot = process.env.SystemRoot || "C:\\Windows";
const currentPath = process.env.PATH || process.env.Path || "";
const fixedPath = `${sys32};${sysRoot};${sys32}\\WindowsPowerShell\\v1.0;${currentPath}`;
const env = { ...process.env, PATH: fixedPath, Path: fixedPath, ComSpec: `${sys32}\\cmd.exe` };

try {
  console.log("Checking server TypeScript build...");
  execSync("npm run build", { cwd: path.resolve(process.cwd(), "server"), env, stdio: "inherit" });
  console.log("Server build SUCCESS!");

  console.log("Checking client Vite build...");
  execSync("npm run build", { cwd: path.resolve(process.cwd(), "client"), env, stdio: "inherit" });
  console.log("Client build SUCCESS!");
} catch (err) {
  console.error("Build failed:", err);
  process.exit(1);
}
