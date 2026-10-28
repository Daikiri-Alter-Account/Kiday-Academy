import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeMessage, serializeService } from "../lib/serialize.js";
import {
  boolean,
  number,
  optionalString,
  slugify,
  string,
  stringArray,
} from "../lib/validate.js";

const router = Router();
const MESSAGE_STATUSES = ["nuevo", "leido", "respondido"];

function toObjectId(value) {
  if (!ObjectId.isValid(value)) throw new HttpError(400, "Identificador inválido.");
  return new ObjectId(value);
}

function isDuplicateKey(error) {
  return error?.code === 11000;
}

function buildServicePayload(body, { partial = false } = {}) {
  const data = {};
  const required = !partial;

  if (required || body.name !== undefined) {
    data.name = string(body.name, "nombre", { max: 120 });
  }

  if (required || body.slug !== undefined) {
    const providedSlug = optionalString(body.slug, "slug", { max: 80 });
    const slug = providedSlug ?? (data.name ? slugify(data.name) : undefined);
    if (!slug) throw new HttpError(400, "El campo slug es obligatorio.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new HttpError(400, "El slug solo admite minúsculas, números y guiones.");
    }
    data.slug = slug;
  }

  if (required || body.tagline !== undefined) {
    data.tagline = string(body.tagline, "tagline", { max: 160 });
  }
  if (required || body.description !== undefined) {
    data.description = string(body.description, "descripción", { max: 1200 });
  }
  if (required || body.price !== undefined) {
    data.price = number(body.price, "precio", { min: 0, max: 100_000_000, required });
  }
  if (required || body.currency !== undefined) {
    const currency = optionalString(body.currency, "moneda", { max: 3 });
    data.currency = (currency ?? "COP").toUpperCase();
  }
  if (required || body.period !== undefined) {
    data.period = optionalString(body.period, "periodo", { max: 40 }) ?? null;
  }
  if (required || body.features !== undefined) {
    data.features = stringArray(body.features, "beneficios");
  }
  if (required || body.highlighted !== undefined) {
    data.highlighted = boolean(body.highlighted, "destacado", false);
  }
  if (required || body.active !== undefined) {
    data.active = boolean(body.active, "activo", true);
  }
  if (required || body.order !== undefined) {
    data.order = number(body.order, "orden", { min: 0, max: 999, integer: true, required: false }) ?? 0;
  }

  return data;
}

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const db = getDb();
    const [messages, newMessages, services, users, students] = await Promise.all([
      db.collection("messages").countDocuments(),
      db.collection("messages").countDocuments({ status: "nuevo" }),
      db.collection("services").countDocuments({ active: true }),
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ role: "student" }),
    ]);

    res.json({ messages, newMessages, services, users, students });
  }),
);

router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !MESSAGE_STATUSES.includes(status)) {
      throw new HttpError(400, "Estado de mensaje inválido.");
    }

    const messages = await getDb()
      .collection("messages")
      .find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json({ messages: messages.map(serializeMessage) });
  }),
);

router.patch(
  "/messages/:id",
  asyncHandler(async (req, res) => {
    const status = string(req.body?.status, "estado", { max: 20 });
    if (!MESSAGE_STATUSES.includes(status)) throw new HttpError(400, "Estado de mensaje inválido.");

    const message = await getDb()
      .collection("messages")
      .findOneAndUpdate(
        { _id: toObjectId(req.params.id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: "after" },
      );

    if (!message) throw new HttpError(404, "Mensaje no encontrado.");
    res.json({ message: serializeMessage(message) });
  }),
);

router.delete(
  "/messages/:id",
  asyncHandler(async (req, res) => {
    const result = await getDb().collection("messages").deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) throw new HttpError(404, "Mensaje no encontrado.");
    res.status(204).end();
  }),
);

router.get(
  "/services",
  asyncHandler(async (req, res) => {
    const services = await getDb()
      .collection("services")
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    res.json({ services: services.map(serializeService) });
  }),
);

router.post(
  "/services",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const data = buildServicePayload(req.body);

    try {
      const result = await getDb()
        .collection("services")
        .insertOne({ ...data, createdAt: now, updatedAt: now });

      const service = await getDb().collection("services").findOne({ _id: result.insertedId });
      res.status(201).json({ service: serializeService(service) });
    } catch (error) {
      if (isDuplicateKey(error)) throw new HttpError(409, "Ya existe un servicio con ese slug.");
      throw error;
    }
  }),
);

router.patch(
  "/services/:id",
  asyncHandler(async (req, res) => {
    const data = buildServicePayload(req.body, { partial: true });
    if (Object.keys(data).length === 0) throw new HttpError(400, "No hay campos para actualizar.");

    try {
      const service = await getDb()
        .collection("services")
        .findOneAndUpdate(
          { _id: toObjectId(req.params.id) },
          { $set: { ...data, updatedAt: new Date() } },
          { returnDocument: "after" },
        );

      if (!service) throw new HttpError(404, "Servicio no encontrado.");
      res.json({ service: serializeService(service) });
    } catch (error) {
      if (isDuplicateKey(error)) throw new HttpError(409, "Ya existe un servicio con ese slug.");
      throw error;
    }
  }),
);

router.delete(
  "/services/:id",
  asyncHandler(async (req, res) => {
    const result = await getDb().collection("services").deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) throw new HttpError(404, "Servicio no encontrado.");
    res.status(204).end();
  }),
);

export const adminRouter = router;
