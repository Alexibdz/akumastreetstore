import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ErrorNegocio } from "./db/errores";
import { CARPETA_DATOS } from "./disco";

// Fotos subidas desde el panel. Se guardan en ./data/uploads (o UPLOADS_PATH) y se sirven en /uploads/<archivo>.
// Con Supabase esto pasaría a Supabase Storage.
const CARPETA = process.env.UPLOADS_PATH || path.join(/*turbopackIgnore: true*/ CARPETA_DATOS, "uploads");
const MAX_BYTES = 15 * 1024 * 1024;
const NOMBRE_VALIDO = /^[a-f0-9-]{36}\.webp$/;

/** Achica la foto (máx. 1600 px), la pasa a WebP y devuelve su URL pública. */
export async function guardarImagen(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) throw new ErrorNegocio(`"${archivo.name}" no es una imagen.`);
  if (archivo.size > MAX_BYTES) throw new ErrorNegocio(`"${archivo.name}" pesa más de 15 MB.`);

  let salida: Buffer;
  try {
    salida = await sharp(Buffer.from(await archivo.arrayBuffer()))
      .rotate() // respeta la orientación de las fotos del celular
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ErrorNegocio(`No se pudo leer "${archivo.name}". Probá con JPG, PNG o WEBP.`);
  }

  await fs.mkdir(CARPETA, { recursive: true });
  const nombre = `${randomUUID()}.webp`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ CARPETA, nombre), salida);
  return `/uploads/${nombre}`;
}

export async function leerImagen(nombre: string): Promise<Buffer | null> {
  if (!NOMBRE_VALIDO.test(nombre)) return null;
  try {
    return await fs.readFile(path.join(/*turbopackIgnore: true*/ CARPETA, nombre));
  } catch {
    return null;
  }
}
