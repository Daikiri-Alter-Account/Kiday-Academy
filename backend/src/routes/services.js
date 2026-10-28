import { Router } from "express";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeService } from "../lib/serialize.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const services = await getDb()
      .collection("services")
      .find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    res.json({ services: services.map(serializeService) });
  }),
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const service = await getDb().collection("services").findOne({
      slug: req.params.slug,
      active: true,
    });

    if (!service) throw new HttpError(404, "Servicio no encontrado.");
    res.json({ service: serializeService(service) });
  }),
);

export const servicesRouter = router;
