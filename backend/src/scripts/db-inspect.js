import { ObjectId } from "mongodb";
import { closeDatabase, connectDatabase, getDb } from "../db.js";

const descriptions = {
  users: "Cuentas de estudiantes y administradores. El campo role define el acceso.",
  sessions: "Sesiones activas. Guarda hashes de tokens, nunca el token original.",
  subjects: "Materias de cada estudiante. Se aíslan por userId.",
  tasks: "Tareas de cada estudiante, asociadas opcionalmente a una materia.",
  services: "Planes del catálogo que se muestran en la landing y se editan en el admin.",
  messages: "Mensajes enviados desde el formulario de contacto.",
};

const hiddenFields = new Set(["passwordHash", "tokenHash"]);

function typeOf(value) {
  if (value instanceof ObjectId) return "ObjectId";
  if (value instanceof Date) return "Date";
  if (Array.isArray(value)) return "Array";
  if (value === null) return "null";
  return typeof value;
}

function sanitize(value, key = "") {
  if (hiddenFields.has(key)) return "*** oculto ***";
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]),
    );
  }
  return value;
}

function summarizeFields(documents) {
  const fields = new Map();

  for (const document of documents) {
    for (const [key, value] of Object.entries(document)) {
      const current = fields.get(key) ?? { types: new Set(), present: 0 };
      current.types.add(typeOf(value));
      current.present += 1;
      fields.set(key, current);
    }
  }

  return [...fields.entries()]
    .map(([key, value]) => ({
      key,
      types: [...value.types].join(" | "),
      coverage: documents.length ? Math.round((value.present / documents.length) * 100) : 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function describeIndex(index) {
  const keys = Object.entries(index.key)
    .map(([field, direction]) => `${field} ${direction === 1 ? "ASC" : direction === -1 ? "DESC" : direction}`)
    .join(", ");
  const flags = [
    index.unique ? "único" : null,
    index.expireAfterSeconds !== undefined ? `TTL ${index.expireAfterSeconds}s` : null,
  ].filter(Boolean);
  return `${keys}${flags.length ? ` (${flags.join(", ")})` : ""}`;
}

let connected = false;

try {
  await connectDatabase();
  connected = true;
  const db = getDb();
  const existing = await db.listCollections().toArray();
  const names = existing.map((collection) => collection.name);
  const ordered = [
    ...Object.keys(descriptions).filter((name) => names.includes(name)),
    ...names.filter((name) => !Object.hasOwn(descriptions, name)).sort(),
  ];

  console.log(`\nBase de datos: ${db.databaseName}`);
  console.log(`Colecciones: ${ordered.length}\n`);

  for (const name of ordered) {
    const collection = db.collection(name);
    const [count, indexes, documents] = await Promise.all([
      collection.countDocuments(),
      collection.indexes(),
      collection.find({}).limit(25).toArray(),
    ]);
    const fields = summarizeFields(documents);

    console.log(`┌─ ${name} (${count} documento${count === 1 ? "" : "s"})`);
    console.log(`│  ${descriptions[name] ?? "Colección adicional sin descripción."}`);
    console.log("│  Campos:");
    for (const field of fields) {
      const hidden = hiddenFields.has(field.key) ? " · valor oculto" : "";
      console.log(`│    - ${field.key}: ${field.types} (${field.coverage}% de los documentos)${hidden}`);
    }
    console.log("│  Índices:");
    for (const index of indexes) {
      console.log(`│    - ${index.name}: ${describeIndex(index)}`);
    }
    if (documents[0]) {
      console.log("│  Ejemplo:");
      const example = JSON.stringify(sanitize(documents[0]), null, 2).split("\n").join("\n│    ");
      console.log(`│    ${example}`);
    }
    console.log("└─\n");
  }

  console.log("Relaciones principales:");
  console.log("  - sessions.userId -> users._id");
  console.log("  - subjects.userId -> users._id");
  console.log("  - tasks.userId -> users._id");
  console.log("  - tasks.subjectId -> subjects._id (opcional)");
  console.log("  - users.role: admin | student");
  console.log("  - services y messages son colecciones independientes.\n");
  console.log("Las materias y tareas se guardan en MongoDB y se aíslan por userId.\n");
} catch (error) {
  console.error("No pudimos inspeccionar la base de datos:", error.message);
  process.exitCode = 1;
} finally {
  if (connected) await closeDatabase();
}
