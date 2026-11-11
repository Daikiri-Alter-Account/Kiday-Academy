import { MongoClient } from "mongodb";
import { config } from "./config.js";

let client = null;
let database = null;

export async function connectDatabase(uri = config.mongoUrl, name = config.mongoDb) {
  if (database) return database;
  if (!uri) {
    throw new Error("Falta MONGO_URL. Configura la cadena de conexión de MongoDB Atlas.");
  }

  client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db(name);
  await ensureIndexes(database);
  return database;
}

export async function closeDatabase() {
  if (client) await client.close();
  client = null;
  database = null;
}

export function getDb() {
  if (!database) throw new Error("La base de datos no está conectada.");
  return database;
}

export async function pingDatabase() {
  await getDb().command({ ping: 1 });
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ role: 1, createdAt: -1 }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("sessions").createIndex({ userId: 1 }),
    db.collection("services").createIndex({ slug: 1 }, { unique: true }),
    db.collection("services").createIndex({ active: 1, order: 1 }),
    db.collection("messages").createIndex({ createdAt: -1 }),
    db.collection("messages").createIndex({ status: 1, createdAt: -1 }),
    db.collection("subjects").createIndex({ userId: 1, createdAt: 1 }),
    db.collection("tasks").createIndex({ userId: 1, dueDate: 1 }),
    db.collection("tasks").createIndex({ userId: 1, done: 1 }),
    db.collection("tasks").createIndex({ userId: 1, subjectId: 1 }),
    db.collection("groups").createIndex({ inviteCode: 1 }, { unique: true }),
    db.collection("groups").createIndex({ ownerId: 1, createdAt: -1 }),
    db.collection("groupMembers").createIndex({ groupId: 1, userId: 1 }, { unique: true }),
    db.collection("groupMembers").createIndex({ userId: 1, joinedAt: 1 }),
    db.collection("groupMembers").createIndex({ groupId: 1, joinedAt: 1 }),
    db.collection("groupSessions").createIndex({ groupId: 1, startsAt: 1 }),
    db.collection("groupMessages").createIndex({ groupId: 1, _id: -1 }),
    db.collection("grades").createIndex({ userId: 1, createdAt: 1 }),
    db.collection("grades").createIndex({ userId: 1, subjectId: 1 }),
    db.collection("materials").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("materials").createIndex({ userId: 1, subjectId: 1 }),
  ]);
}
