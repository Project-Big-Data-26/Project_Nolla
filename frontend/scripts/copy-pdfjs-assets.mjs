import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(projectRoot, "node_modules", "pdfjs-dist");
const publicRoot = resolve(projectRoot, "public", "pdfjs");

await mkdir(publicRoot, { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  await cp(resolve(packageRoot, directory), resolve(publicRoot, directory), {
    recursive: true,
    force: true,
  });
}

console.log("PDF.js runtime assets are ready in public/pdfjs.");
