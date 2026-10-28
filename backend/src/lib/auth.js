import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb } from "../db.js";
import { config } from "../config.js";
import { HttpError } from "./http.js";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, salt, hash] = String(stored).split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const derived = await scrypt(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createSession(db, userId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);

  await db.collection("sessions").insertOne({
    tokenHash: hashToken(token),
    userId,
    createdAt: new Date(),
    expiresAt,
  });

  return { token, expiresAt };
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.get("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) throw new HttpError(401, "Sesión requerida.");

    const db = getDb();
    const session = await db.collection("sessions").findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session) throw new HttpError(401, "La sesión no es válida o expiró.");

    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) throw new HttpError(401, "Usuario no encontrado.");

    req.user = publicUser(user);
    req.sessionId = session._id;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new HttpError(403, "No tienes permisos de administrador."));
  }
  next();
}
