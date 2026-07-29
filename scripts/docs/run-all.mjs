/**
 * Full docs pipeline: screenshots → PDF manual.
 * Usage: pnpm docs:all
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

function run(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [file], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`)),
    );
  });
}

await run(path.join(__dirname, "capture-screenshots.mjs"));
await run(path.join(__dirname, "build-manual.mjs"));
console.log("Docs pipeline complete.");
