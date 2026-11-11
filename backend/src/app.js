import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { pingDatabase } from "./db.js";
import { authenticate, requireAdmin } from "./lib/auth.js";
import { asyncHandler, errorHandler, notFound } from "./lib/http.js";
import { adminRouter } from "./routes/admin.js";
import { aiRouter } from "./routes/ai.js";
import { authRouter } from "./routes/auth.js";
import { contactRouter } from "./routes/contact.js";
import { gradesRouter } from "./routes/grades.js";
import { groupsRouter } from "./routes/groups.js";
import { servicesRouter } from "./routes/services.js";
import { workspaceRouter } from "./routes/workspace.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: "128kb" }));

  app.get(
    "/api/health",
    asyncHandler(async (req, res) => {
      await pingDatabase();
      res.json({ status: "ok", service: "kiday-academy-api", time: new Date().toISOString() });
    }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/contact", contactRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/workspace", authenticate, workspaceRouter);
  app.use("/api/groups", authenticate, groupsRouter);
  app.use("/api/grades", authenticate, gradesRouter);
  app.use("/api/admin", authenticate, requireAdmin, adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
