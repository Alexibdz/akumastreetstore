import { createHmac, timingSafeEqual } from "node:crypto";

// Sesión del panel: una cookie "<vencimiento>.<firma HMAC>". No guarda datos, solo prueba que se ingresó la contraseña.
// Sin dependencias de Next para poder usarlo también desde proxy.ts.

export const COOKIE_SESION = "akuma_admin";
export const DURACION_SESION_S = 60 * 60 * 24 * 7; // 7 días

const secreto = () => process.env.ADMIN_SECRET || `akuma-street:${process.env.ADMIN_PASSWORD ?? ""}`;
const firmar = (vence: string) => createHmac("sha256", secreto()).update(`admin:${vence}`).digest("hex");

export function crearToken() {
  const vence = String(Date.now() + DURACION_SESION_S * 1000);
  return `${vence}.${firmar(vence)}`;
}

export function tokenValido(token: string | undefined | null) {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const [vence, firma] = token.split(".");
  if (!vence || !firma || Number(vence) < Date.now()) return false;
  const esperado = Buffer.from(firmar(vence));
  const recibido = Buffer.from(firma);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

/** Compara en tiempo constante (no revela cuántos caracteres coinciden). */
export function passwordCorrecta(intento: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const hash = (s: string) => createHmac("sha256", "comparar").update(s).digest();
  return timingSafeEqual(hash(intento), hash(real));
}
