import { Router } from "express";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { authenticate, createSession, hashPassword, publicUser, verifyPassword } from "../lib/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { email as validateEmail, string } from "../lib/validate.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = validateEmail(req.body?.email);
    const password = string(req.body?.password, "contraseña", { max: 200, trim: false });

    const db = getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Correo o contraseña incorrectos.");
    }

    const session = await createSession(db, user._id);
    res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(user),
    });
  }),
);

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const name = string(req.body?.name, "nombre", { min: 2, max: 80 });
    const email = validateEmail(req.body?.email);
    const password = string(req.body?.password, "contraseña", { min: 8, max: 200, trim: false });

    const db = getDb();
    const now = new Date();

    try {
      const result = await db.collection("users").insertOne({
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "student",
        createdAt: now,
        updatedAt: now,
      });

      const user = { _id: result.insertedId, name, email, role: "student" };
      const session = await createSession(db, result.insertedId);

      res.status(201).json({
        token: session.token,
        expiresAt: session.expiresAt,
        user: publicUser(user),
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, "Ya existe una cuenta con ese correo.");
      }
      throw error;
    }
  }),
);

router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await getDb().collection("sessions").deleteOne({ _id: req.sessionId });
    res.status(204).end();
  }),
);

export const authRouter = router;
