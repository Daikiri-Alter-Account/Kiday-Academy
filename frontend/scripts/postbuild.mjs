import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDirectory = join(process.cwd(), "dist");
const indexPath = join(distDirectory, "index.html");
const notFoundPath = join(distDirectory, "404.html");

if (!existsSync(indexPath)) {
  throw new Error("No se encontró dist/index.html. Ejecuta vite build primero.");
}

copyFileSync(indexPath, notFoundPath);
console.log("GitHub Pages: dist/404.html generado como fallback de la SPA.");
