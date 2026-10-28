export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ error: "Ruta no encontrada." });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) {
    if (error instanceof HttpError) console.warn(error.message);
    else console.error(error);
  }

  const publicMessage = status < 500 || status === 502 || status === 503;

  res.status(status).json({
    error: publicMessage ? error.message : "Error interno del servidor.",
    ...(error.details ? { details: error.details } : {}),
  });
}
