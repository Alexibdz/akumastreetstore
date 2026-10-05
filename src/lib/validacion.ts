import { ErrorNegocio } from "./db/errores";

// Validaciones de lo que llega a las acciones del panel (nunca confiar en el navegador).

export function texto(valor: unknown, campo: string, { requerido = false, max = 200 } = {}) {
  const s = typeof valor === "string" ? valor.trim() : "";
  if (requerido && !s) throw new ErrorNegocio(`Falta ${campo}.`);
  if (s.length > max) throw new ErrorNegocio(`El campo ${campo} es muy largo (máximo ${max} caracteres).`);
  return s;
}

/** Acepta 54900, "54900", "54.900" o "$54.900". Vacío -> null. */
export function enteroOpcional(valor: unknown, campo: string, { min = 0, max = 1_000_000_000 } = {}): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(/[$\s.]/g, "").replace(",", "."));
  if (!Number.isFinite(n)) throw new ErrorNegocio(`El campo ${campo} tiene que ser un número.`);
  const entero = Math.round(n);
  if (entero < min) throw new ErrorNegocio(`El campo ${campo} tiene que ser ${min} o más.`);
  if (entero > max) throw new ErrorNegocio(`El campo ${campo} es demasiado grande.`);
  return entero;
}

export function entero(valor: unknown, campo: string, opciones: { min?: number; max?: number } = {}): number {
  const n = enteroOpcional(valor, campo, opciones);
  if (n === null) throw new ErrorNegocio(`Falta ${campo}.`);
  return n;
}

export function unoDe<T extends string>(valor: unknown, opciones: readonly T[], campo: string): T {
  if (typeof valor === "string" && (opciones as readonly string[]).includes(valor)) return valor as T;
  throw new ErrorNegocio(`Elegí ${campo}.`);
}
