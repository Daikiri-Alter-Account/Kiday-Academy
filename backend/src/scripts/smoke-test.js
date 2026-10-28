import assert from "node:assert/strict";
import { once } from "node:events";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();

process.env.MONGO_URL = mongod.getUri();
process.env.MONGO_DB = "kiday_test";
process.env.ADMIN_NAME = "Admin de prueba";
process.env.ADMIN_EMAIL = "admin@kiday.test";
process.env.ADMIN_PASSWORD = "clave-segura-123";
process.env.AI_API_KEY = "";
process.env.CORS_ORIGIN = "http://localhost:5173";

const { connectDatabase, closeDatabase, getDb } = await import("../db.js");
const { seedDatabase } = await import("../seed.js");
const { createApp } = await import("../app.js");

let server;

try {
  await connectDatabase();
  const seeded = await seedDatabase(getDb(), {
    admin: {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  assert.equal(seeded.adminCreated, true, "El admin debe crearse en la primera ejecución");
  assert.equal(seeded.servicesCreated, 3, "Deben crearse los 3 servicios del catálogo");

  server = createApp().listen(0);
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(path, { method = "GET", token, body } = {}) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = response.status === 204 ? null : await response.json();
    return { status: response.status, data };
  }

  const health = await request("/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.data.status, "ok");

  const catalog = await request("/api/services");
  assert.equal(catalog.status, 200);
  assert.equal(catalog.data.services.length, 3);
  assert.equal(catalog.data.services[0].slug, "kiday-free");

  const contact = await request("/api/contact", {
    method: "POST",
    body: {
      name: "Estudiante de prueba",
      email: "estudiante@kiday.test",
      subject: "Quiero información de Kiday Pro",
      message: "Hola, quiero saber si el plan Pro incluye el asistente de IA.",
    },
  });
  assert.equal(contact.status, 201);
  assert.ok(contact.data.id);

  const unauthorized = await request("/api/admin/messages");
  assert.equal(unauthorized.status, 401);

  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@kiday.test", password: "incorrecta" },
  });
  assert.equal(badLogin.status, 401);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@kiday.test", password: "clave-segura-123" },
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.role, "admin");
  const token = login.data.token;
  assert.ok(token);

  const me = await request("/api/auth/me", { token });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, "admin@kiday.test");

  const messages = await request("/api/admin/messages", { token });
  assert.equal(messages.status, 200);
  assert.equal(messages.data.messages.length, 1);

  const stats = await request("/api/admin/stats", { token });
  assert.equal(stats.status, 200);
  assert.equal(stats.data.messages, 1);
  assert.equal(stats.data.newMessages, 1);

  const created = await request("/api/admin/services", {
    method: "POST",
    token,
    body: {
      name: "Asesoría 1 a 1",
      tagline: "Acompañamiento personalizado",
      description: "Sesión individual para resolver dudas de una materia concreta.",
      price: 49900,
      period: "sesión",
      features: ["60 minutos", "Plan de estudio personalizado"],
      order: 4,
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.service.slug, "asesoria-1-a-1");

  const updated = await request(`/api/admin/services/${created.data.service.id}`, {
    method: "PATCH",
    token,
    body: { highlighted: true },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.service.highlighted, true);

  const publicCatalog = await request("/api/services");
  assert.equal(publicCatalog.data.services.length, 4);

  const ai = await request("/api/ai/chat", {
    method: "POST",
    token,
    body: { messages: [{ role: "user", content: "¿Qué plan me recomiendas?" }] },
  });
  assert.equal(ai.status, 503);

  const logout = await request("/api/auth/logout", { method: "POST", token });
  assert.equal(logout.status, 204);

  const expired = await request("/api/auth/me", { token });
  assert.equal(expired.status, 401);

  console.log("Smoke test de la API: OK (catálogo, contacto, auth y admin).");
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase();
  await mongod.stop();
}
