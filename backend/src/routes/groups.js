import { randomBytes } from "node:crypto";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { rateLimit } from "../lib/rate-limit.js";
import {
  serializeGroup,
  serializeGroupMember,
  serializeGroupMessage,
  serializeGroupSession,
} from "../lib/serialize.js";
import { number, optionalString, string } from "../lib/validate.js";

const router = Router();

const GROUP_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
];
const MAX_MEMBERS = 50;
const MAX_UPCOMING_SESSIONS = 50;
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const messageLimiter = rateLimit({ windowMs: 60_000, max: 30 });

function toObjectId(value, field = "identificador") {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new HttpError(400, `El ${field} no es válido.`);
  }
  return new ObjectId(value);
}

function currentUserId(req) {
  return toObjectId(req.user?.id, "usuario");
}

function accentFor(name) {
  const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return GROUP_COLORS[total % GROUP_COLORS.length];
}

function randomCode() {
  return Array.from(randomBytes(8), (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

async function createInviteCode(db) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const existing = await db
      .collection("groups")
      .findOne({ inviteCode: code }, { projection: { _id: 1 } });
    if (!existing) return code;
  }
  throw new HttpError(503, "No pudimos generar un código de invitación. Intenta de nuevo.");
}

function buildGroupData(body) {
  return {
    name: string(body?.name, "nombre", { max: 60 }),
    subject: string(body?.subject, "materia", { max: 60 }),
    description: optionalString(body?.description, "descripción", { max: 280 }) ?? "",
  };
}

function sessionStartsAt(value) {
  const raw = string(value, "fecha y hora", { max: 40 });
  const date = new Date(raw);
  const now = Date.now();

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "La fecha y hora de la sesión no es válida.");
  }
  if (date.getTime() < now - 5 * 60 * 1000) {
    throw new HttpError(400, "La sesión debe programarse para una fecha futura.");
  }
  if (date.getTime() > now + 2 * 365 * 24 * 60 * 60 * 1000) {
    throw new HttpError(400, "La sesión no puede programarse con más de dos años de anticipación.");
  }
  return date;
}

function buildSessionData(body) {
  return {
    title: string(body?.title, "título", { max: 80 }),
    startsAt: sessionStartsAt(body?.startsAt),
    durationMinutes: number(body?.durationMinutes ?? 60, "duración", {
      integer: true,
      min: 15,
      max: 480,
    }),
    location: optionalString(body?.location, "lugar", { max: 160 }) ?? "",
  };
}

async function findMembership(db, groupId, userId) {
  return db.collection("groupMembers").findOne({ groupId, userId });
}

async function loadUsers(db, userIds) {
  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))].map((id) => new ObjectId(id));
  if (uniqueIds.length === 0) return new Map();

  const users = await db
    .collection("users")
    .find({ _id: { $in: uniqueIds } })
    .project({ name: 1, firstName: 1, lastName: 1 })
    .toArray();

  return new Map(users.map((user) => [user._id.toString(), user]));
}

async function loadGroupDetail(db, groupId, userId, membership = null) {
  const member = membership ?? (await findMembership(db, groupId, userId));
  if (!member) throw new HttpError(404, "El grupo no existe o no perteneces a él.");

  const group = await db.collection("groups").findOne({ _id: groupId });
  if (!group) throw new HttpError(404, "El grupo no existe.");

  const [memberDocs, sessionDocs] = await Promise.all([
    db.collection("groupMembers").find({ groupId }).sort({ joinedAt: 1, _id: 1 }).toArray(),
    db
      .collection("groupSessions")
      .find({ groupId, startsAt: { $gte: new Date() } })
      .sort({ startsAt: 1, _id: 1 })
      .limit(MAX_UPCOMING_SESSIONS)
      .toArray(),
  ]);

  const users = await loadUsers(db, memberDocs.map((item) => item.userId));
  const members = memberDocs.flatMap((item) => {
    const user = users.get(item.userId.toString());
    return user ? [serializeGroupMember(item, user)] : [];
  });

  return serializeGroup(group, {
    role: member.role,
    memberCount: memberDocs.length,
    members,
    sessions: sessionDocs.map(serializeGroupSession),
  });
}

async function loadGroupSummaries(db, userId) {
  const memberships = await db
    .collection("groupMembers")
    .find({ userId })
    .sort({ joinedAt: 1 })
    .toArray();

  if (memberships.length === 0) return [];

  const groupIds = memberships.map((item) => item.groupId);
  const [groups, memberDocs, sessionDocs] = await Promise.all([
    db
      .collection("groups")
      .find({ _id: { $in: groupIds } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("groupMembers")
      .find({ groupId: { $in: groupIds } })
      .sort({ joinedAt: 1, _id: 1 })
      .toArray(),
    db
      .collection("groupSessions")
      .find({ groupId: { $in: groupIds }, startsAt: { $gte: new Date() } })
      .sort({ startsAt: 1, _id: 1 })
      .limit(500)
      .toArray(),
  ]);

  const users = await loadUsers(db, memberDocs.map((item) => item.userId));
  const roleByGroup = new Map(memberships.map((item) => [item.groupId.toString(), item.role]));
  const membersByGroup = new Map();
  const sessionsByGroup = new Map();

  for (const item of memberDocs) {
    const key = item.groupId.toString();
    const list = membersByGroup.get(key) ?? [];
    list.push(item);
    membersByGroup.set(key, list);
  }

  for (const session of sessionDocs) {
    const key = session.groupId.toString();
    const list = sessionsByGroup.get(key) ?? [];
    list.push(session);
    sessionsByGroup.set(key, list);
  }

  return groups.map((group) => {
    const key = group._id.toString();
    const members = (membersByGroup.get(key) ?? []).slice(0, 4).flatMap((item) => {
      const user = users.get(item.userId.toString());
      return user ? [serializeGroupMember(item, user)] : [];
    });
    const sessions = sessionsByGroup.get(key) ?? [];

    return serializeGroup(group, {
      role: roleByGroup.get(key) ?? "member",
      memberCount: (membersByGroup.get(key) ?? []).length,
      members,
      sessions: sessions.slice(0, 1).map(serializeGroupSession),
    });
  });
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ groups: await loadGroupSummaries(getDb(), currentUserId(req)) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const data = buildGroupData(req.body);
    const now = new Date();

    const result = await db.collection("groups").insertOne({
      ...data,
      ownerId: userId,
      inviteCode: await createInviteCode(db),
      accent: accentFor(data.name),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await db.collection("groupMembers").insertOne({
        groupId: result.insertedId,
        userId,
        role: "owner",
        joinedAt: now,
      });
    } catch (error) {
      await db.collection("groups").deleteOne({ _id: result.insertedId });
      throw error;
    }

    res.status(201).json({ group: await loadGroupDetail(db, result.insertedId, userId) });
  }),
);

router.post(
  "/join",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const raw = string(req.body?.code, "código", { max: 20 }).toUpperCase();
    const code = raw.replace(/[^A-Z0-9]/g, "");

    if (code.length < 6 || code.length > 12) {
      throw new HttpError(400, "El código de invitación no es válido.");
    }

    const group = await db.collection("groups").findOne({ inviteCode: code });
    if (!group) throw new HttpError(404, "No encontramos un grupo con ese código.");

    const existing = await findMembership(db, group._id, userId);
    if (existing) {
      return res.json({ group: await loadGroupDetail(db, group._id, userId, existing) });
    }

    const memberCount = await db.collection("groupMembers").countDocuments({ groupId: group._id });
    if (memberCount >= MAX_MEMBERS) {
      throw new HttpError(409, "El grupo alcanzó el límite de miembros.");
    }

    try {
      await db.collection("groupMembers").insertOne({
        groupId: group._id,
        userId,
        role: "member",
        joinedAt: new Date(),
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }

    res.json({ group: await loadGroupDetail(db, group._id, userId) });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const groupId = toObjectId(req.params.id, "grupo");
    res.json({ group: await loadGroupDetail(getDb(), groupId, currentUserId(req)) });
  }),
);

router.post(
  "/:id/leave",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const userId = currentUserId(req);
    const membership = await findMembership(db, groupId, userId);

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");
    if (membership.role === "owner") {
      throw new HttpError(400, "El creador no puede salir del grupo. Puedes eliminarlo.");
    }

    await db.collection("groupMembers").deleteOne({ _id: membership._id });
    res.status(204).end();
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const userId = currentUserId(req);
    const membership = await findMembership(db, groupId, userId);

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");
    if (membership.role !== "owner") {
      throw new HttpError(403, "Solo el creador puede eliminar el grupo.");
    }

    await Promise.all([
      db.collection("groups").deleteOne({ _id: groupId }),
      db.collection("groupMembers").deleteMany({ groupId }),
      db.collection("groupSessions").deleteMany({ groupId }),
      db.collection("groupMessages").deleteMany({ groupId }),
    ]);

    res.status(204).end();
  }),
);

router.post(
  "/:id/sessions",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const userId = currentUserId(req);
    const membership = await findMembership(db, groupId, userId);

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");
    if (membership.role !== "owner") {
      throw new HttpError(403, "Solo el creador puede programar sesiones.");
    }

    const group = await db.collection("groups").findOne({ _id: groupId }, { projection: { _id: 1 } });
    if (!group) throw new HttpError(404, "El grupo no existe.");

    const now = new Date();
    const result = await db.collection("groupSessions").insertOne({
      ...buildSessionData(req.body),
      groupId,
      createdBy: userId,
      createdAt: now,
    });

    await db.collection("groups").updateOne({ _id: groupId }, { $set: { updatedAt: now } });

    const session = await db.collection("groupSessions").findOne({ _id: result.insertedId });
    res.status(201).json({ session: serializeGroupSession(session) });
  }),
);

router.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const membership = await findMembership(db, groupId, currentUserId(req));

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");

    const limit = number(req.query.limit ?? 50, "límite", { integer: true, min: 1, max: 100 });
    const before = req.query.before ? toObjectId(req.query.before, "mensaje") : null;
    const filter = { groupId, ...(before ? { _id: { $lt: before } } : {}) };

    const docs = await db
      .collection("groupMessages")
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit).reverse();
    const users = await loadUsers(db, page.map((message) => message.userId));
    const messages = page.flatMap((message) => {
      const user = users.get(message.userId.toString());
      return user ? [serializeGroupMessage(message, user)] : [];
    });

    res.json({
      messages,
      hasMore,
      nextBefore: hasMore && page.length > 0 ? page[0]._id.toString() : null,
    });
  }),
);

router.post(
  "/:id/messages",
  messageLimiter,
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const userId = currentUserId(req);
    const membership = await findMembership(db, groupId, userId);

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");

    const content = string(req.body?.content, "mensaje", { max: 1000 });
    const now = new Date();
    const result = await db.collection("groupMessages").insertOne({
      groupId,
      userId,
      content,
      createdAt: now,
    });

    await db.collection("groups").updateOne({ _id: groupId }, { $set: { updatedAt: now } });

    const [message, user] = await Promise.all([
      db.collection("groupMessages").findOne({ _id: result.insertedId }),
      db.collection("users").findOne({ _id: userId }),
    ]);

    res.status(201).json({ message: serializeGroupMessage(message, user) });
  }),
);

router.delete(
  "/:id/messages/:messageId",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const messageId = toObjectId(req.params.messageId, "mensaje");
    const userId = currentUserId(req);
    const membership = await findMembership(db, groupId, userId);

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");

    const message = await db
      .collection("groupMessages")
      .findOne({ _id: messageId, groupId });
    if (!message) throw new HttpError(404, "El mensaje no existe.");

    const isAuthor = message.userId.toString() === userId.toString();
    if (!isAuthor && membership.role !== "owner") {
      throw new HttpError(403, "Solo el autor o el creador pueden eliminar este mensaje.");
    }

    await db.collection("groupMessages").deleteOne({ _id: messageId });
    res.status(204).end();
  }),
);

router.delete(
  "/:id/sessions/:sessionId",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const groupId = toObjectId(req.params.id, "grupo");
    const sessionId = toObjectId(req.params.sessionId, "sesión");
    const membership = await findMembership(db, groupId, currentUserId(req));

    if (!membership) throw new HttpError(404, "El grupo no existe o no perteneces a él.");
    if (membership.role !== "owner") {
      throw new HttpError(403, "Solo el creador puede eliminar sesiones.");
    }

    const result = await db
      .collection("groupSessions")
      .deleteOne({ _id: sessionId, groupId });
    if (result.deletedCount === 0) throw new HttpError(404, "La sesión no existe.");

    res.status(204).end();
  }),
);

export const groupsRouter = router;
