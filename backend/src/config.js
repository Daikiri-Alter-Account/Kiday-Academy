function parseOrigins(value) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUrl: process.env.MONGO_URL ?? "",
  mongoDb: process.env.MONGO_DB ?? "kiday_academy",
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGIN ??
      "http://localhost:5173,http://localhost:4173,https://daikiri-alter-account.github.io",
  ),
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  admin: {
    name: process.env.ADMIN_NAME ?? "Administrador",
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  },
  ai: {
    url: process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions",
    key: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  },
};
