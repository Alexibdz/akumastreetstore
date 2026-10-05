"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAccion } from "@/components/admin/interactivos";
import { verificarSesion } from "@/lib/auth";
import { MOTIVOS_AJUSTE } from "@/lib/catalogo";
import { ErrorNegocio, mensajeDeError } from "@/lib/db/errores";
import { ajustarStock, ingresarStock } from "@/lib/db/stock";
import { entero, enteroOpcional, texto, unoDe } from "@/lib/validacion";

async function ejecutar(fn: () => Promise<void>, mensaje: string): Promise<EstadoAccion> {
  await verificarSesion();
  try {
    await fn();
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout");
  return { ok: true, mensaje };
}

export async function ingresarAccion(_previo: EstadoAccion | null, form: FormData): Promise<EstadoAccion> {
  return ejecutar(async () => {
    const cantidad = entero(form.get("cantidad"), "la cantidad", { min: 1, max: 100000 });
    await ingresarStock({
      varianteId: entero(form.get("varianteId"), "el producto", { min: 1 }),
      cantidad,
      costoUnitario: enteroOpcional(form.get("costo"), "costo"),
      registrarGasto: form.get("registrarGasto") === "on",
      actualizarCosto: form.get("actualizarCosto") === "on",
      nota: texto(form.get("nota"), "nota", { max: 200 }),
    });
  }, "Ingreso registrado.");
}

export async function ajustarAccion(_previo: EstadoAccion | null, form: FormData): Promise<EstadoAccion> {
  return ejecutar(async () => {
    await ajustarStock({
      varianteId: entero(form.get("varianteId"), "el producto", { min: 1 }),
      stockReal: entero(form.get("stockReal"), "el stock contado", { min: 0, max: 100000 }),
      motivo: unoDe(form.get("motivo"), MOTIVOS_AJUSTE, "el motivo"),
      nota: texto(form.get("nota"), "nota", { max: 200 }),
    });
  }, "Stock ajustado.");
}
