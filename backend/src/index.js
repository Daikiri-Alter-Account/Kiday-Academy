import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeDatabase, connectDatabase } from "./db.js";

async function start() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`API de Kiday Academy escuchando en el puerto ${config.port}.`);
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Cerrando la API por ${signal}...`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(async (error) => {
  console.error("No se pudo iniciar la API:", error.message);
  await closeDatabase();
  process.exit(1);
});
