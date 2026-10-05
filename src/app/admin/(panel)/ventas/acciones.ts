"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultadoAccion } from "@/components/admin/interactivos";
import { verificarSesion } from "@/lib/auth";
import { CANALES, MEDIOS_PAGO } from "@/lib/catalogo";
import { ErrorNegocio, mensajeDeError } from "@/lib/db/errores";
import { anularVenta, registrarVenta } from "@/lib/db/ventas";
import { diaAR, esDia } from "@/lib/formato";
import { entero, texto, unoDe } from "@/lib/validacion";

export type DatosFormularioVenta = {
  items: { varianteId: number; cantidad: number; precioUnitario: number }[];
  descuento: number | string;
  medioPago: string;
  canal: string;
  cliente: string;
  notas: string;
  dia: string;
};

export async function registrarVentaAccion(d: DatosFormularioVenta): Promise<ResultadoAccion> {
  await verificarSesion();
  let id: number;
  try {
    if (!Array.isArray(d.items) || d.items.length === 0) throw new ErrorNegocio("Agregá al menos un producto.");
    if (d.items.length > 100) throw new ErrorNegocio("Demasiados productos en una sola venta.");
    const items = d.items.map((i) => ({
      varianteId: entero(i.varianteId, "producto", { min: 1 }),
      cantidad: entero(i.cantidad, "cantidad", { min: 1, max: 9999 }),
      precioUnitario: entero(i.precioUnitario, "precio", { min: 0 }),
    }));
    if (new Set(items.map((i) => i.varianteId)).size !== items.length) throw new ErrorNegocio("Hay un producto repetido.");
    if (!esDia(d.dia) || d.dia > diaAR()) throw new ErrorNegocio("La fecha no es válida (no puede ser futura).");

    id = await registrarVenta({
      items,
      descuento: entero(d.descuento || 0, "descuento"),
      medioPago: unoDe(d.medioPago, MEDIOS_PAGO.map((m) => m.id), "el medio de pago"),
      canal: unoDe(d.canal, CANALES.map((c) => c.id), "el canal"),
      cliente: texto(d.cliente, "cliente", { max: 80 }),
      notas: texto(d.notas, "notas", { max: 500 }),
      dia: d.dia,
    });
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout"); // stock y números nuevos en la tienda y el panel
  redirect(`/admin/ventas/${id}?nueva=1`);
}

export async function anularVentaAccion(id: number): Promise<ResultadoAccion> {
  await verificarSesion();
  try {
    await anularVenta(id);
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
