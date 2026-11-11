import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeGradeItem } from "../lib/serialize.js";
import { number, string } from "../lib/validate.js";

const router = Router();

function toObjectId(value, field = "identificador") {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new HttpError(400, `El ${field} no es válido.`);
  }
  return new ObjectId(value);
}

function currentUserId(req) {
  return toObjectId(req.user?.id, "usuario");
}

async function subjectFor(db, value, userId) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const subjectId = toObjectId(value, "materia");
  const subject = await db
    .collection("subjects")
    .findOne({ _id: subjectId, userId }, { projection: { _id: 1 } });
  if (!subject) throw new HttpError(400, "La materia seleccionada no existe.");

  return subjectId;
}

async function buildGradeData(db, body, userId, existing = null) {
  const partial = existing !== null;
  const name =
    body?.name !== undefined || !partial
      ? string(body?.name, "nombre", { max: 80 })
      : existing.name;
  const gradeValue =
    body?.grade !== undefined || !partial
      ? number(body?.grade, "nota", { min: 0, max: 5 })
      : existing.grade;
  const weight =
    body?.weight !== undefined || !partial
      ? number(body?.weight, "peso", { integer: true, min: 0, max: 100 })
      : existing.weight;
  const subjectId =
    body?.subjectId !== undefined
      ? await subjectFor(db, body.subjectId, userId)
      : existing?.subjectId ?? null;

  return {
    name,
    grade: Math.round(gradeValue * 10) / 10,
    weight,
    subjectId,
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const grades = await getDb()
      .collection("grades")
      .find({ userId: currentUserId(req) })
      .sort({ subjectId: 1, createdAt: 1, _id: 1 })
      .toArray();

    res.json({ grades: grades.map(serializeGradeItem) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const now = new Date();
    const data = await buildGradeData(db, req.body, userId);
    const result = await db.collection("grades").insertOne({
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const grade = await db.collection("grades").findOne({ _id: result.insertedId });
    res.status(201).json({ grade: serializeGradeItem(grade) });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const gradeId = toObjectId(req.params.id, "nota");
    const existing = await db.collection("grades").findOne({ _id: gradeId, userId });
    if (!existing) throw new HttpError(404, "La actividad no existe.");

    const data = await buildGradeData(db, req.body, userId, existing);
    const grade = await db.collection("grades").findOneAndUpdate(
      { _id: gradeId, userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    res.json({ grade: serializeGradeItem(grade) });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const gradeId = toObjectId(req.params.id, "nota");
    const result = await getDb()
      .collection("grades")
      .deleteOne({ _id: gradeId, userId: currentUserId(req) });

    if (result.deletedCount === 0) throw new HttpError(404, "La actividad no existe.");
    res.status(204).end();
  }),
);

export const gradesRouter = router;
