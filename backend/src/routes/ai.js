import { Router } from "express";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { rateLimit } from "../lib/rate-limit.js";

const router = Router();
const chatLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

router.post(
  "/chat",
  chatLimiter,
  asyncHandler(async (req, res) => {
    if (!config.ai.key) {
      throw new HttpError(
        503,
        "Kiday IA aún no está configurada. El administrador debe definir AI_API_KEY.",
      );
    }

    const incoming = req.body?.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      throw new HttpError(400, "Envía al menos un mensaje.");
    }

    const messages = incoming.slice(-12).map((message) => {
      if (message?.role !== "user" && message?.role !== "assistant") {
        throw new HttpError(400, "Cada mensaje debe tener rol user o assistant.");
      }
      if (typeof message.content !== "string" || !message.content.trim()) {
        throw new HttpError(400, "El contenido del mensaje no puede estar vacío.");
      }
      if (message.content.length > 4000) {
        throw new HttpError(400, "El mensaje supera el límite de 4000 caracteres.");
      }
      return { role: message.role, content: message.content.trim() };
    });

    const services = await getDb()
      .collection("services")
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();

    const response = await fetch(config.ai.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ai.key}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [{ role: "system", content: buildSystemPrompt(services) }, ...messages],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Error del proveedor de IA:", response.status, detail.slice(0, 500));
      throw new HttpError(502, "La IA no respondió correctamente. Intenta de nuevo.");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new HttpError(502, "La IA devolvió una respuesta vacía.");

    res.json({ reply });
  }),
);

function buildSystemPrompt(services) {
  const catalog = services
    .map((service) => {
      const price =
        service.price === 0
          ? "gratis"
          : `$${service.price.toLocaleString("es-CO")} ${service.currency}${service.period ? ` por ${service.period}` : ""}`;
      return `- ${service.name} (${price}): ${service.tagline}. Beneficios: ${service.features.join(", ")}.`;
    })
    .join("\n");

  return `Eres Kiday IA, el asistente académico de Kiday Academy, una plataforma para estudiantes de colegio, universidad y aprendizaje autónomo.

Personalidad: cercana, clara y motivadora. Hablas en español neutro, con respuestas breves y accionables. No regañas ni juzgas al estudiante.

Reglas:
- Ayuda con organización académica, técnicas de estudio, tareas, notas y hábitos.
- Conoce y recomienda únicamente los planes del catálogo cuando sea relevante.
- No inventes precios, beneficios ni promociones. Si falta información, invita a usar el formulario de contacto.
- No pidas datos sensibles ni compartas información privada de otros usuarios.
- Si la pregunta no es académica ni tiene relación con Kiday, redirige con amabilidad.

Catálogo actual de Kiday Academy:
${catalog}`;
}

export const aiRouter = router;
