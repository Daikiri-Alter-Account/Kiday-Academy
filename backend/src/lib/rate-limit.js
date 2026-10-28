export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const buckets = new Map();

  return function limiter(req, res, next) {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Demasiadas solicitudes. Intenta de nuevo más tarde." });
    }

    if (buckets.size > 5_000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    next();
  };
}
