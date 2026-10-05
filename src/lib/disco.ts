import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Dónde se guardan la base y las fotos: ./data, o /tmp si el disco es de solo lectura (Vercel).
// En /tmp la web funciona como demo: arranca con la copia de demo/akuma.db y los cambios se pierden
// cada vez que el servidor se reinicia.
const CARPETA_LOCAL = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");

function escribible(carpeta: string) {
  try {
    fs.mkdirSync(carpeta, { recursive: true });
    fs.accessSync(carpeta, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export const DISCO_SOLO_LECTURA = !escribible(CARPETA_LOCAL);

export const CARPETA_DATOS = DISCO_SOLO_LECTURA ? path.join(os.tmpdir(), "akuma") : CARPETA_LOCAL;

/** Copia de la base que se usa como punto de partida cuando el disco es de solo lectura. */
export const BASE_DEMO = path.join(/*turbopackIgnore: true*/ process.cwd(), "demo", "akuma.db");
