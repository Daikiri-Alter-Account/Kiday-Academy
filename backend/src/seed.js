import { servicesSeed } from "./data/services.seed.js";
import { hashPassword } from "./lib/auth.js";

export async function seedDatabase(db, { admin } = {}) {
  const now = new Date();

  const result = await db.collection("services").bulkWrite(
    servicesSeed.map((service) => ({
      updateOne: {
        filter: { slug: service.slug },
        update: {
          $setOnInsert: { ...service, active: true, createdAt: now, updatedAt: now },
        },
        upsert: true,
      },
    })),
  );

  let adminCreated = false;
  if (admin?.email && admin?.password) {
    const email = admin.email.toLowerCase();
    const existing = await db.collection("users").findOne({ email });

    if (!existing) {
      await db.collection("users").insertOne({
        name: admin.name ?? "Administrador",
        email,
        passwordHash: await hashPassword(admin.password),
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });
      adminCreated = true;
    }
  }

  return { servicesCreated: result.upsertedCount, adminCreated };
}
