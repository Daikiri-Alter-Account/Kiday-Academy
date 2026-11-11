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

  const register = await request("/api/auth/register", {
    method: "POST",
    body: {
      firstName: "Estudiante",
      lastName: "De Prueba",
      birthDate: "2005-05-15",
      institution: "Colegio Kiday",
      grade: "11.º",
      email: "estudiante@kiday.test",
      password: "clave-estudiante-123",
    },
  });
  assert.equal(register.status, 201);
  assert.equal(register.data.user.role, "student");
  assert.equal(register.data.user.name, "Estudiante De Prueba");
  assert.equal(register.data.user.firstName, "Estudiante");
  assert.equal(register.data.user.lastName, "De Prueba");
  assert.equal(register.data.user.birthDate, "2005-05-15");
  assert.ok(register.data.user.age >= 20);
  assert.equal(register.data.user.institution, "Colegio Kiday");
  assert.equal(register.data.user.grade, "11.º");
  assert.equal(register.data.user.plan, "kiday-free");
  assert.ok(register.data.user.capabilities.includes("tasks"));
  assert.equal(register.data.user.capabilities.includes("groups"), false);
  assert.ok(register.data.token);

  const studentMe = await request("/api/auth/me", { token: register.data.token });
  assert.equal(studentMe.status, 200);
  assert.equal(studentMe.data.user.email, "estudiante@kiday.test");
  assert.equal(studentMe.data.user.firstName, "Estudiante");
  assert.equal(studentMe.data.user.plan, "kiday-free");

  const workspaceUnauthorized = await request("/api/workspace");
  assert.equal(workspaceUnauthorized.status, 401);

  const emptyWorkspace = await request("/api/workspace", { token: register.data.token });
  assert.equal(emptyWorkspace.status, 200);
  assert.equal(emptyWorkspace.data.subjects.length, 0);
  assert.equal(emptyWorkspace.data.tasks.length, 0);

  const createdSubject = await request("/api/workspace/subjects", {
    method: "POST",
    token: register.data.token,
    body: {
      name: "Álgebra lineal",
      detail: "Parcial 1",
      average: 4.2,
      completed: 1,
      total: 3,
      status: "al-dia",
    },
  });
  assert.equal(createdSubject.status, 201);
  assert.equal(createdSubject.data.subject.name, "Álgebra lineal");
  assert.ok(createdSubject.data.subject.id);

  const createdTask = await request("/api/workspace/tasks", {
    method: "POST",
    token: register.data.token,
    body: {
      title: "Resolver taller de matrices",
      subjectId: createdSubject.data.subject.id,
      dueDate: "2026-12-01",
      priority: "alta",
    },
  });
  assert.equal(createdTask.status, 201);
  assert.equal(createdTask.data.task.subjectId, createdSubject.data.subject.id);

  const populatedWorkspace = await request("/api/workspace", { token: register.data.token });
  assert.equal(populatedWorkspace.data.subjects.length, 1);
  assert.equal(populatedWorkspace.data.tasks.length, 1);

  const updatedSubject = await request(
    `/api/workspace/subjects/${createdSubject.data.subject.id}`,
    {
      method: "PATCH",
      token: register.data.token,
      body: { average: 4.8, completed: 2 },
    },
  );
  assert.equal(updatedSubject.status, 200);
  assert.equal(updatedSubject.data.subject.average, 4.8);
  assert.equal(updatedSubject.data.subject.completed, 2);

  const updatedTask = await request(`/api/workspace/tasks/${createdTask.data.task.id}`, {
    method: "PATCH",
    token: register.data.token,
    body: { done: true },
  });
  assert.equal(updatedTask.status, 200);
  assert.equal(updatedTask.data.task.done, true);

  const duplicateRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      firstName: "Otra",
      lastName: "Persona",
      birthDate: "2004-03-20",
      email: "estudiante@kiday.test",
      password: "otra-clave-123",
    },
  });
  assert.equal(duplicateRegister.status, 409);

  const invalidBirthDate = await request("/api/auth/register", {
    method: "POST",
    body: {
      firstName: "Fecha",
      lastName: "Inválida",
      birthDate: "2030-01-01",
      email: "fecha-invalida@kiday.test",
      password: "clave-invalida-123",
    },
  });
  assert.equal(invalidBirthDate.status, 400);

  const studentAdminAccess = await request("/api/admin/messages", {
    token: register.data.token,
  });
  assert.equal(studentAdminAccess.status, 403);

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
  assert.equal(login.data.user.plan, null);
  assert.deepEqual(login.data.user.capabilities, []);
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
  assert.equal(stats.data.students, 1);

  const secondRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      firstName: "Segundo",
      lastName: "Estudiante",
      birthDate: "2006-09-10",
      email: "estudiante2@kiday.test",
      password: "clave-estudiante-456",
    },
  });
  assert.equal(secondRegister.status, 201);

  const secondWorkspace = await request("/api/workspace", {
    token: secondRegister.data.token,
  });
  assert.equal(secondWorkspace.data.subjects.length, 0);
  assert.equal(secondWorkspace.data.tasks.length, 0);

  const groupsUnauthorized = await request("/api/groups");
  assert.equal(groupsUnauthorized.status, 401);

  const createdGroup = await request("/api/groups", {
    method: "POST",
    token: register.data.token,
    body: {
      name: "Cálculo sin miedo",
      subject: "Cálculo diferencial",
      description: "Repasamos derivadas y resolvemos talleres juntos.",
    },
  });
  assert.equal(createdGroup.status, 201);
  assert.equal(createdGroup.data.group.role, "owner");
  assert.equal(createdGroup.data.group.memberCount, 1);
  assert.equal(createdGroup.data.group.members[0].role, "owner");
  assert.equal(createdGroup.data.group.inviteCode.length, 8);
  assert.ok(createdGroup.data.group.id);

  const firstGroups = await request("/api/groups", { token: register.data.token });
  assert.equal(firstGroups.status, 200);
  assert.equal(firstGroups.data.groups.length, 1);
  assert.equal(firstGroups.data.groups[0].role, "owner");

  const invalidGroupCode = await request("/api/groups/join", {
    method: "POST",
    token: secondRegister.data.token,
    body: { code: "ZZZZZZZZ" },
  });
  assert.equal(invalidGroupCode.status, 404);

  const joinedGroup = await request("/api/groups/join", {
    method: "POST",
    token: secondRegister.data.token,
    body: { code: createdGroup.data.group.inviteCode },
  });
  assert.equal(joinedGroup.status, 200);
  assert.equal(joinedGroup.data.group.role, "member");
  assert.equal(joinedGroup.data.group.memberCount, 2);

  const groupDetail = await request(`/api/groups/${createdGroup.data.group.id}`, {
    token: register.data.token,
  });
  assert.equal(groupDetail.status, 200);
  assert.equal(groupDetail.data.group.memberCount, 2);
  assert.equal(groupDetail.data.group.members.length, 2);

  const memberSession = await request(`/api/groups/${createdGroup.data.group.id}/sessions`, {
    method: "POST",
    token: secondRegister.data.token,
    body: {
      title: "Repaso de derivadas",
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      durationMinutes: 90,
      location: "Biblioteca",
    },
  });
  assert.equal(memberSession.status, 403);

  const createdSession = await request(`/api/groups/${createdGroup.data.group.id}/sessions`, {
    method: "POST",
    token: register.data.token,
    body: {
      title: "Repaso de derivadas",
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      durationMinutes: 90,
      location: "Biblioteca",
    },
  });
  assert.equal(createdSession.status, 201);
  assert.equal(createdSession.data.session.title, "Repaso de derivadas");
  assert.equal(createdSession.data.session.durationMinutes, 90);

  const emptyMessage = await request(`/api/groups/${createdGroup.data.group.id}/messages`, {
    method: "POST",
    token: secondRegister.data.token,
    body: { content: "   " },
  });
  assert.equal(emptyMessage.status, 400);

  const secondMessage = await request(`/api/groups/${createdGroup.data.group.id}/messages`, {
    method: "POST",
    token: secondRegister.data.token,
    body: { content: "¿Nos vemos en la biblioteca?" },
  });
  assert.equal(secondMessage.status, 201);
  assert.equal(secondMessage.data.message.content, "¿Nos vemos en la biblioteca?");
  assert.equal(secondMessage.data.message.author.name, "Segundo Estudiante");

  const groupMessages = await request(`/api/groups/${createdGroup.data.group.id}/messages`, {
    token: register.data.token,
  });
  assert.equal(groupMessages.status, 200);
  assert.equal(groupMessages.data.messages.length, 1);
  assert.equal(groupMessages.data.messages[0].author.name, "Segundo Estudiante");

  const deleteOtherMessage = await request(
    `/api/groups/${createdGroup.data.group.id}/messages/${secondMessage.data.message.id}`,
    { method: "DELETE", token: register.data.token },
  );
  assert.equal(deleteOtherMessage.status, 204);

  const secondMessageAgain = await request(`/api/groups/${createdGroup.data.group.id}/messages`, {
    method: "POST",
    token: secondRegister.data.token,
    body: { content: "Mensaje que eliminará su autor." },
  });
  assert.equal(secondMessageAgain.status, 201);

  const deleteOwnMessage = await request(
    `/api/groups/${createdGroup.data.group.id}/messages/${secondMessageAgain.data.message.id}`,
    { method: "DELETE", token: secondRegister.data.token },
  );
  assert.equal(deleteOwnMessage.status, 204);

  const groupWithSession = await request(`/api/groups/${createdGroup.data.group.id}`, {
    token: secondRegister.data.token,
  });
  assert.equal(groupWithSession.status, 200);
  assert.equal(groupWithSession.data.group.nextSession.id, createdSession.data.session.id);

  const ownerLeave = await request(`/api/groups/${createdGroup.data.group.id}/leave`, {
    method: "POST",
    token: register.data.token,
  });
  assert.equal(ownerLeave.status, 400);

  const memberLeave = await request(`/api/groups/${createdGroup.data.group.id}/leave`, {
    method: "POST",
    token: secondRegister.data.token,
  });
  assert.equal(memberLeave.status, 204);

  const leftGroup = await request(`/api/groups/${createdGroup.data.group.id}`, {
    token: secondRegister.data.token,
  });
  assert.equal(leftGroup.status, 404);

  const deletedGroup = await request(`/api/groups/${createdGroup.data.group.id}`, {
    method: "DELETE",
    token: register.data.token,
  });
  assert.equal(deletedGroup.status, 204);

  const groupsAfterDelete = await request("/api/groups", { token: register.data.token });
  assert.equal(groupsAfterDelete.data.groups.length, 0);

  const crossSubjectUpdate = await request(
    `/api/workspace/subjects/${createdSubject.data.subject.id}`,
    {
      method: "PATCH",
      token: secondRegister.data.token,
      body: { average: 1 },
    },
  );
  assert.equal(crossSubjectUpdate.status, 404);

  const crossTaskCreate = await request("/api/workspace/tasks", {
    method: "POST",
    token: secondRegister.data.token,
    body: {
      title: "Tarea ajena",
      subjectId: createdSubject.data.subject.id,
      dueDate: "2026-12-02",
      priority: "media",
    },
  });
  assert.equal(crossTaskCreate.status, 400);

  const imported = await request("/api/workspace/import", {
    method: "POST",
    token: secondRegister.data.token,
    body: {
      subjects: [
        {
          id: "legacy-subject",
          name: "Materia importada",
          detail: "Desde el navegador",
          average: 3.5,
          completed: 1,
          total: 4,
          status: "pendiente",
        },
      ],
      tasks: [
        {
          id: "legacy-task",
          title: "Tarea importada",
          subjectId: "legacy-subject",
          dueDate: "2026-12-03",
          priority: "baja",
          done: false,
        },
      ],
    },
  });
  assert.equal(imported.status, 201);
  assert.equal(imported.data.subjects.length, 1);
  assert.equal(imported.data.tasks.length, 1);
  assert.equal(imported.data.tasks[0].subjectId, imported.data.subjects[0].id);

  const deletedSubject = await request(
    `/api/workspace/subjects/${createdSubject.data.subject.id}`,
    { method: "DELETE", token: register.data.token },
  );
  assert.equal(deletedSubject.status, 204);

  const workspaceAfterDelete = await request("/api/workspace", {
    token: register.data.token,
  });
  assert.equal(workspaceAfterDelete.data.subjects.length, 0);
  assert.equal(workspaceAfterDelete.data.tasks.length, 0);

  const standaloneTask = await request("/api/workspace/tasks", {
    method: "POST",
    token: register.data.token,
    body: {
      title: "Tarea sin materia",
      subjectId: null,
      dueDate: "2026-12-04",
      priority: "baja",
    },
  });
  assert.equal(standaloneTask.status, 201);
  assert.equal(standaloneTask.data.task.subjectId, null);

  const deletedTask = await request(`/api/workspace/tasks/${standaloneTask.data.task.id}`, {
    method: "DELETE",
    token: register.data.token,
  });
  assert.equal(deletedTask.status, 204);

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
    body: { messages: [{ role: "user", content: "¿Qué plan me recomiendas?" }] },
  });
  assert.equal(ai.status, 503);
  assert.match(ai.data.error, /no está configurada/i);

  const logout = await request("/api/auth/logout", { method: "POST", token });
  assert.equal(logout.status, 204);

  const expired = await request("/api/auth/me", { token });
  assert.equal(expired.status, 401);

  console.log("Smoke test de la API: OK (catálogo, contacto, auth, admin, espacio académico, grupos y chat).");
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase();
  await mongod.stop();
}
