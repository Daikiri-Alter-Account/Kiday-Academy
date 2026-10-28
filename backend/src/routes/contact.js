import { Router } from "express";
import { getDb } from "../db.js";
import { asyncHandler } from "../lib/http.js";
import { rateLimit } from "../lib/rate-limit.js";
import { email as validateEmail, string } from "../lib/validate.js";

const router = Router();
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post(
  "/",
  contactLimiter,
  asyncHandler(async (req, res) => {
    const name = string(req.body?.name, "nombre", { max: 120 });
    const email = validateEmail(req.body?.email);
    const subject = string(req.body?.subject ?? "Consulta general", "asunto", { max: 160 });
    const message = string(req.body?.message, "mensaje", { min: 10, max: 2000 });

    const now = new Date();
    const result = await getDb().collection("messages").insertOne({
      name,
      email,
      subject,
      message,
      status: "nuevo",
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      id: result.insertedId.toString(),
      message: "Mensaje recibido. Te responderemos muy pronto.",
    });
  }),
);

export const contactRouter = router;
