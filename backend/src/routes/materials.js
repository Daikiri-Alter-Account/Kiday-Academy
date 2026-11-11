import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeMaterial } from "../lib/serialize.js";
import { optionalString, string } from "../lib/validate.js";

const router = Router();

const MATERIAL_TYPES = ["apunte", "pdf", "video", "enlace", "ejercicio", "libro"];

function toObjectId(value, field = "identificador") {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new HttpError(400, `El ${field} no es válido.`);
  }
  return new ObjectId(value);
}

function currentUserId(req) {
  return toObjectId(req.user?.id, "usuario");
}

function urlValue(value) {
  const result = string(value, "enlace", { max: 500 });
  let url;
  try {
    url = new URL(result);
  } catch {
    throw new HttpError(400, "El enlace no es válido.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new HttpError(400, "El enlace debe comenzar con http:// o https://.");
  }
  return url.toString();
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

async function buildMaterialData(db, body, userId, existing = null) {
  const partial = existing !== null;
  const title =
    body?.title !== undefined || !partial
      ? string(body?.title, "título", { max: 140 })
      : existing.title;
  const url =
    body?.url !== undefined || !partial ? urlValue(body?.url) : existing.url;
  const type =
    body?.type !== undefined || !partial
      ? string(body?.type ?? "enlace", "tipo", { max: 20 })
      : existing.type;
  if (!MATERIAL_TYPES.includes(type)) {
    throw new HttpError(400, "El tipo de material no es válido.");
  }

  const description =
    body?.description !== undefined || !partial
      ? optionalString(body?.description, "descripción", { max: 300 }) ?? ""
      : existing.description ?? "";
  const subjectId =
    body?.subjectId !== undefined
      ? await subjectFor(db, body.subjectId, userId)
      : existing?.subjectId ?? null;

  return { title, url, type, description, subjectId };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const materials = await getDb()
      .collection("materials")
      .find({ userId: currentUserId(req) })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    res.json({ materials: materials.map(serializeMaterial) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const now = new Date();
    const data = await buildMaterialData(db, req.body, userId);
    const result = await db.collection("materials").insertOne({
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const material = await db.collection("materials").findOne({ _id: result.insertedId });
    res.status(201).json({ material: serializeMaterial(material) });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = currentUserId(req);
    const materialId = toObjectId(req.params.id, "material");
    const existing = await db.collection("materials").findOne({ _id: materialId, userId });
    if (!existing) throw new HttpError(404, "El material no existe.");

    const data = await buildMaterialData(db, req.body, userId, existing);
    const material = await db.collection("materials").findOneAndUpdate(
      { _id: materialId, userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    res.json({ material: serializeMaterial(material) });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const materialId = toObjectId(req.params.id, "material");
    const result = await getDb()
      .collection("materials")
      .deleteOne({ _id: materialId, userId: currentUserId(req) });

    if (result.deletedCount === 0) throw new HttpError(404, "El material no existe.");
    res.status(204).end();
  }),
);

export const materialsRouter = router;
