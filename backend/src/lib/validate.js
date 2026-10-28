import { HttpError } from "./http.js";

export function string(value, field, { required = true, min = 1, max = 200, trim = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `El campo ${field} es obligatorio.`);
    return undefined;
  }
  if (typeof value !== "string") throw new HttpError(400, `El campo ${field} debe ser texto.`);

  const result = trim ? value.trim() : value;
  if (result.length < min) throw new HttpError(400, `El campo ${field} debe tener al menos ${min} caracteres.`);
  if (result.length > max) throw new HttpError(400, `El campo ${field} no puede superar ${max} caracteres.`);
  return result;
}

export function optionalString(value, field, options = {}) {
  return string(value, field, { ...options, required: false });
}

export function email(value, field = "correo") {
  const result = string(value, field, { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    throw new HttpError(400, "Ingresa un correo electrónico válido.");
  }
  return result;
}

export function number(value, field, { required = true, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `El campo ${field} es obligatorio.`);
    return undefined;
  }

  const result = Number(value);
  if (!Number.isFinite(result)) throw new HttpError(400, `El campo ${field} debe ser numérico.`);
  if (integer && !Number.isInteger(result)) throw new HttpError(400, `El campo ${field} debe ser entero.`);
  if (result < min || result > max) {
    throw new HttpError(400, `El campo ${field} debe estar entre ${min} y ${max}.`);
  }
  return result;
}

export function boolean(value, field, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new HttpError(400, `El campo ${field} debe ser booleano.`);
  return value;
}

export function stringArray(value, field, { maxItems = 12, maxLength = 160 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, `El campo ${field} debe ser una lista.`);
  if (value.length > maxItems) throw new HttpError(400, `El campo ${field} no puede tener más de ${maxItems} elementos.`);

  return value.map((item) => string(item, field, { max: maxLength }));
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
