import { config } from "../config.js";
import { closeDatabase, connectDatabase, getDb } from "../db.js";
import { seedDatabase } from "../seed.js";

async function main() {
  await connectDatabase();

  const result = await seedDatabase(getDb(), {
    admin: {
      name: config.admin.name,
      email: config.admin.email,
      password: config.admin.password,
    },
  });

  console.log(`Servicios nuevos: ${result.servicesCreated}.`);
  console.log(`Administrador creado: ${result.adminCreated ? "sí" : "no"}.`);

  if (!config.admin.email || !config.admin.password) {
    console.warn("Define ADMIN_EMAIL y ADMIN_PASSWORD en .env para crear el administrador.");
  }
}

main()
  .catch((error) => {
    console.error("Error al poblar la base de datos:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
