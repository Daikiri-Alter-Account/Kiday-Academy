import { spawn } from "node:child_process";

const commands = [
  { name: "API", args: ["--prefix", "backend", "run", "dev"] },
  { name: "WEB", args: ["--prefix", "frontend", "run", "dev"] },
];

let shuttingDown = false;

const children = commands.map(({ name, args }) => {
  const child = spawn("npm", args, {
    detached: true,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.log(`\n[${name}] terminó (${signal ?? code ?? "sin código"}). Cerrando el resto...`);
    shutdown();
    process.exitCode = code && code !== 0 ? code : 1;
  });

  return child;
});

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode !== null) continue;
    try {
      process.kill(-child.pid, "SIGINT");
    } catch {
      // El proceso ya terminó.
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
