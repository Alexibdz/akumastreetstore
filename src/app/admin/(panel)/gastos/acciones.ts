"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAccion, ResultadoAccion } from "@/components/admin/interactivos";
import { verificarSesion } from "@/lib/auth";
import { CATEGORIAS_GASTO } from "@/lib/catalogo";
import { ErrorNegocio, mensajeDeError } from "@/lib/db/errores";
import { crearGasto, eliminarGasto } from "@/lib/db/gastos";
import { diaAR, esDia } from "@/lib/formato";
import { entero, texto, unoDe } from "@/lib/validacion";

export async function crearGastoAccion(_previo: EstadoAccion | null, form: FormData): Promise<EstadoAccion> {
  await verificarSesion();
  try {
    const fecha = form.get("fecha");
    if (!esDia(fecha) || fecha > diaAR()) throw new ErrorNegocio("La fecha no es válida (no puede ser futura).");
    await crearGasto({
      fecha,
      categoria: unoDe(form.get("categoria"), CATEGORIAS_GASTO.map((c) => c.id), "la categoría"),
      descripcion: texto(form.get("descripcion"), "descripción", { max: 200 }),
      monto: entero(form.get("monto"), "el monto", { min: 1 }),
    });
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, mensaje: "Gasto cargado." };
}

export async function eliminarGastoAccion(id: number): Promise<ResultadoAccion> {
  await verificarSesion();
  await eliminarGasto(id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
