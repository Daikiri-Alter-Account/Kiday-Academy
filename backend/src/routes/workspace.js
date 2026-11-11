import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeSubject, serializeTask } from "../lib/serialize.js";
import { boolean, number, optionalString, string } from "../lib/validate.js";

const router = Router();

const SUBJECT_STATUSES = ["al-dia", "pendiente", "atrasada"];
const TASK_PRIORITIES = ["alta", "media", "baja"];
const SUBJECT_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
];

function toObjectId(value, field = "identificador") {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new HttpError(400, `El ${field} no es válido.`);
  }
  return new ObjectId(value);
}

function currentUserId(req) {
  return toObjectId(req.user?.id, "usuario");
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function dateValue(value) {
  const result = string(value, "fecha", { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    throw new HttpError(400, "La fecha debe tener el formato AAAA-MM-DD.");
  }
  const date = new Date(`${result}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== result) {
    throw new HttpError(400, "La fecha no es válida.");
  }
  return result;
}

function buildSubjectData(body, existing = null) {
  const partial = existing !== null;
  const name = body.name !== undefined || !partial ? string(body.name, "nombre", { max: 80 }) : existing.name;
  const detail =
    body.detail !== undefined || !partial
      ? optionalString(body.detail, "detalle", { max: 120 }) ?? "Sin detalle"
      : existing.detail;

  const averageValue =
    body.average !== undefined || !partial
      ? number(body.average, "promedio", { min: 0, max: 5 })
      : existing.average;
  const completed =
    body.completed !== undefined || !partial
      ? number(body.completed, "actividades completadas", { integer: true, min: 0, max: 10000 })
      : existing.completed;
  const total =
    body.total !== undefined || !partial
      ? number(body.total, "total de actividades", { integer: true, min: 1, max: 10000 })
      : existing.total;

  if (completed > total) {
    throw new HttpError(400, "Las actividades completadas no pueden superar el total.");
  }

  const status =
    body.status !== undefined || !partial
      ? string(body.status, "estado", { max: 20 })
      : existing.status;
  if (!SUBJECT_STATUSES.includes(status)) {
    throw new HttpError(400, "El estado de la materia no es válido.");
  }

  const icon =
    body.icon !== undefined
      ? optionalString(body.icon, "icono", { max: 4 }) ?? initials(name)
      : existing?.icon ?? initials(name);

  const color =
    body.color !== undefined
      ? optionalString(body.color, "color", { max: 80 }) ?? SUBJECT_COLORS[0]
      : existing?.color ?? SUBJECT_COLORS[0];

  if (!SUBJECT_COLORS.includes(color)) {
    throw new HttpError(400, "El color de la materia no es válido.");
  }

  return {
    name,
    detail,
    icon,
    color,
    average: Math.round(averageValue * 10) / 10,
    completed,
    total,
    status,
  };
}

async function ensureSubjectOwner(db, subjectId, userId) {
  if (!subjectId) return null;
  const subject = await db.collection("subjects").findOne({
    _id: subjectId,
    userId,
  });
  if (!subject) throw new HttpError(400, "La materia seleccionada no existe.");
  return subjectId;
}

function buildTaskData(body, existing = null) {
  const partial = existing !== null;
  const title =
    body.title !== undefined || !partial ? string(body.title, "título", { max: 140 }) : existing.title;
  const dueDate =
    body.dueDate !== undefined || !partial ? dateValue(body.dueDate) : existing.dueDate;

  const priority =
    body.priority !== undefined || !partial
      ? string(body.priority, "prioridad", { max: 20 })
      : existing.priority;
  if (!TASK_PRIORITIES.includes(priority)) {
    throw new HttpError(400, "La prioridad no es válida.");
  }

  const done =
    body.done !== undefined || !partial
      ? boolean(body.done, "completada", false)
      : existing.done;

  return { title, dueDate, priority, done };
}

async function loadWorkspace(db, userId) {
  const [subjects, tasks] = await Promise.all([
    db.collection("subjects").find({ userId }).sort({ createdAt: 1, _id: 1 }).toArray(),
    db.collection("tasks").find({ userId }).sort({ dueDate: 1, createdAt: 1, _id: 1 }).toArray(),
  ]);

  return {
    subjects: subjects.map(serializeSubject),
    tasks: tasks.map(serializeTask),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await loadWorkspace(getDb(), currentUserId(req)));
  }),
);

router.post(
  "/import",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const current = await loadWorkspace(db, userId);

    if (current.subjects.length > 0 || current.tasks.length > 0) {
      return res.json(current);
    }

    const subjectsInput = req.body?.subjects ?? [];
    const tasksInput = req.body?.tasks ?? [];
    if (!Array.isArray(subjectsInput) || !Array.isArray(tasksInput)) {
      throw new HttpError(400, "Las materias y tareas deben ser listas.");
    }
    if (subjectsInput.length > 100 || tasksInput.length > 500) {
      throw new HttpError(400, "El espacio de trabajo supera el límite de importación.");
    }

    const now = new Date();
    const subjectIds = new Map();
    const insertedSubjectIds = [];
    const insertedTaskIds = [];

    try {
      if (subjectsInput.length > 0) {
        const subjectDocs = subjectsInput.map((item, index) => {
          const legacyId = String(item?.id ?? `subject-${index}`);
          if (subjectIds.has(legacyId)) {
            throw new HttpError(400, "Hay identificadores de materia duplicados.");
          }
          subjectIds.set(legacyId, null);
          return {
            ...buildSubjectData(item),
            userId,
            createdAt: now,
            updatedAt: now,
          };
        });

        const result = await db.collection("subjects").insertMany(subjectDocs);
        subjectDocs.forEach((subject, index) => {
          const insertedId = result.insertedIds[index];
          subjectIds.set(String(subjectsInput[index]?.id ?? `subject-${index}`), insertedId);
          insertedSubjectIds.push(insertedId);
        });
      }

      if (tasksInput.length > 0) {
        const taskDocs = tasksInput.map((item) => {
          const data = buildTaskData({ ...item, subjectId: undefined });
          const legacySubjectId = item?.subjectId ? String(item.subjectId) : null;
          return {
            ...data,
            subjectId: legacySubjectId ? subjectIds.get(legacySubjectId) ?? null : null,
            userId,
            createdAt: now,
            updatedAt: now,
          };
        });

        const result = await db.collection("tasks").insertMany(taskDocs);
        Object.values(result.insertedIds).forEach((insertedId) => insertedTaskIds.push(insertedId));
      }

      res.status(201).json(await loadWorkspace(db, userId));
    } catch (error) {
      await Promise.all([
        insertedTaskIds.length
          ? db.collection("tasks").deleteMany({ _id: { $in: insertedTaskIds } })
          : Promise.resolve(),
        insertedSubjectIds.length
          ? db.collection("subjects").deleteMany({ _id: { $in: insertedSubjectIds } })
          : Promise.resolve(),
      ]);
      throw error;
    }
  }),
);

router.post(
  "/subjects",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const now = new Date();
    const data = buildSubjectData(req.body);
    const result = await db.collection("subjects").insertOne({
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    const subject = await db.collection("subjects").findOne({ _id: result.insertedId });
    res.status(201).json({ subject: serializeSubject(subject) });
  }),
);

router.patch(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const subjectId = toObjectId(req.params.id);
    const existing = await db.collection("subjects").findOne({ _id: subjectId, userId });
    if (!existing) throw new HttpError(404, "Materia no encontrada.");

    const data = buildSubjectData(req.body, existing);
    const subject = await db.collection("subjects").findOneAndUpdate(
      { _id: subjectId, userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    res.json({ subject: serializeSubject(subject) });
  }),
);

router.delete(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const subjectId = toObjectId(req.params.id);
    const result = await db.collection("subjects").deleteOne({ _id: subjectId, userId });
    if (result.deletedCount === 0) throw new HttpError(404, "Materia no encontrada.");

    await Promise.all([
      db.collection("tasks").deleteMany({ userId, subjectId }),
      db.collection("grades").deleteMany({ userId, subjectId }),
      db.collection("materials").deleteMany({ userId, subjectId }),
    ]);
    res.status(204).end();
  }),
);

router.post(
  "/tasks",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const subjectId =
      req.body?.subjectId === undefined || req.body?.subjectId === null || req.body?.subjectId === ""
        ? null
        : toObjectId(req.body.subjectId, "materia");
    await ensureSubjectOwner(db, subjectId, userId);

    const now = new Date();
    const result = await db.collection("tasks").insertOne({
      ...buildTaskData(req.body),
      subjectId,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const task = await db.collection("tasks").findOne({ _id: result.insertedId });
    res.status(201).json({ task: serializeTask(task) });
  }),
);

router.patch(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const taskId = toObjectId(req.params.id);
    const existing = await db.collection("tasks").findOne({ _id: taskId, userId });
    if (!existing) throw new HttpError(404, "Tarea no encontrada.");

    const subjectId =
      req.body?.subjectId === undefined
        ? existing.subjectId
        : req.body.subjectId === null || req.body.subjectId === ""
          ? null
          : toObjectId(req.body.subjectId, "materia");
    await ensureSubjectOwner(db, subjectId, userId);

    const data = buildTaskData(req.body, existing);
    const task = await db.collection("tasks").findOneAndUpdate(
      { _id: taskId, userId },
      { $set: { ...data, subjectId, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    res.json({ task: serializeTask(task) });
  }),
);

router.delete(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const result = await getDb()
      .collection("tasks")
      .deleteOne({ _id: toObjectId(req.params.id), userId: currentUserId(req) });
    if (result.deletedCount === 0) throw new HttpError(404, "Tarea no encontrada.");
    res.status(204).end();
  }),
);

export const workspaceRouter = router;
