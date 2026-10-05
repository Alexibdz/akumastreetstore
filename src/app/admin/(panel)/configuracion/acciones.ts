"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoAccion } from "@/components/admin/interactivos";
import { verificarSesion } from "@/lib/auth";
import { borrarOperaciones, guardarConfiguracion } from "@/lib/db/configuracion";
import { ErrorNegocio, mensajeDeError } from "@/lib/db/errores";
import type { Configuracion } from "@/lib/tipos";
import { entero } from "@/lib/validacion";

export async function guardarConfiguracionAccion(c: Configuracion): Promise<ResultadoAccion> {
  await verificarSesion();
  try {
    const whatsapp = String(c.whatsapp ?? "").replace(/\D/g, "");
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      throw new ErrorNegocio("El WhatsApp tiene que tener el código de país y de área, sin espacios: 5491112345678.");
    }
    const instagram = String(c.instagram ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) throw new ErrorNegocio("El usuario de Instagram no es válido.");

    await guardarConfiguracion({
      whatsapp,
      instagram,
      mostrarPrecios: Boolean(c.mostrarPrecios),
      umbralStockBajo: entero(c.umbralStockBajo, "el umbral de stock bajo", { min: 0, max: 1000 }),
    });
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Cambios guardados." };
}

export async function borrarOperacionesAccion(): Promise<ResultadoAccion> {
  await verificarSesion();
  await borrarOperaciones();
  revalidatePath("/", "layout");
  return { ok: true };
}
