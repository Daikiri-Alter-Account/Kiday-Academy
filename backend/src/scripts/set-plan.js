import { closeDatabase, connectDatabase, getDb } from "../db.js";
import { PLAN_SLUGS } from "../lib/plans.js";

const [rawEmail, plan] = process.argv.slice(2);

function usage() {
  console.log("Uso: npm run plan:set -- correo@ejemplo.com kiday-academy");
  console.log(`Planes disponibles: ${PLAN_SLUGS.join(", ")}`);
}

if (!rawEmail || !plan) {
  usage();
  process.exitCode = 1;
} else if (!PLAN_SLUGS.includes(plan)) {
  console.error(`Plan inválido: ${plan}`);
  usage();
  process.exitCode = 1;
} else {
  const email = rawEmail.trim().toLowerCase();
  let connected = false;

  try {
    await connectDatabase();
    connected = true;
    const now = new Date();
    const result = await getDb().collection("users").updateOne(
      { email, role: "student" },
      { $set: { plan, planStartedAt: now, updatedAt: now } },
    );

    if (result.matchedCount === 0) {
      console.error(`No encontramos una cuenta de estudiante con el correo ${email}.`);
      process.exitCode = 1;
    } else {
      console.log(`Plan ${plan} asignado a ${email}.`);
    }
  } catch (error) {
    console.error("No pudimos actualizar el plan:", error.message);
    process.exitCode = 1;
  } finally {
    if (connected) await closeDatabase();
  }
}
