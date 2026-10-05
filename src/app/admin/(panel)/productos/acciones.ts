"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultadoAccion } from "@/components/admin/interactivos";
import { verificarSesion } from "@/lib/auth";
import { CATEGORIAS, ETIQUETAS } from "@/lib/catalogo";
import { ErrorNegocio, mensajeDeError } from "@/lib/db/errores";
import { actualizarProducto, alternarProducto, crearProducto, eliminarProducto, type DatosProducto } from "@/lib/db/productos";
import { normalizar } from "@/lib/texto";
import { entero, enteroOpcional, texto, unoDe } from "@/lib/validacion";

export type FormularioProducto = {
  nombre: string;
  slug: string;
  categoria: string;
  serie: string;
  descripcion: string;
  precio: string;
  precioAnterior: string;
  costo: string;
  etiqueta: string;
  destacado: boolean;
  visible: boolean;
  imagenes: string[];
  variantes: { id?: number; nombre: string; stockInicial?: string }[];
};

// Fotos subidas desde el panel o fotos de ejemplo de public/demo
const IMAGEN_VALIDA = /^\/(uploads\/[a-f0-9-]{36}|demo\/[a-z0-9-]+)\.webp$/;

function validar(f: FormularioProducto, creando: boolean): DatosProducto {
  const precio = entero(f.precio, "el precio");
  const precioAnterior = enteroOpcional(f.precioAnterior, "precio anterior");
  if (precioAnterior !== null && precioAnterior <= precio) {
    throw new ErrorNegocio("El precio anterior (el tachado de la oferta) tiene que ser mayor que el precio actual. Si no hay oferta, dejalo vacío.");
  }
  if (!Array.isArray(f.imagenes) || f.imagenes.length > 10 || f.imagenes.some((u) => !IMAGEN_VALIDA.test(u))) {
    throw new ErrorNegocio("Alguna de las fotos no es válida. Volvé a subirla.");
  }
  const variantes = (Array.isArray(f.variantes) ? f.variantes : []).map((v) => ({
    id: typeof v.id === "number" ? v.id : undefined,
    nombre: texto(v.nombre, "talle", { max: 20 }),
    stockInicial: creando ? (enteroOpcional(v.stockInicial, "stock inicial", { max: 100000 }) ?? 0) : undefined,
  }));
  const conNombre = variantes.filter((v) => v.nombre);
  if (variantes.length > 1 && conNombre.length !== variantes.length) throw new ErrorNegocio("Hay un talle sin nombre.");
  if (new Set(conNombre.map((v) => normalizar(v.nombre))).size !== conNombre.length) throw new ErrorNegocio("Hay talles repetidos.");
  if (variantes.length > 30) throw new ErrorNegocio("Demasiados talles (máximo 30).");

  return {
    nombre: texto(f.nombre, "el nombre", { requerido: true, max: 120 }),
    slug: texto(f.slug, "la URL", { max: 80 }),
    categoria: unoDe(f.categoria, CATEGORIAS.map((c) => c.slug), "la categoría"),
    serie: texto(f.serie, "serie", { max: 60 }),
    descripcion: texto(f.descripcion, "descripción", { max: 3000 }),
    precio,
    precioAnterior,
    costo: enteroOpcional(f.costo, "costo"),
    etiqueta: f.etiqueta ? unoDe(f.etiqueta, ETIQUETAS, "la etiqueta") : null,
    destacado: Boolean(f.destacado),
    visible: Boolean(f.visible),
    imagenes: f.imagenes,
    variantes: variantes.length ? variantes : [{ nombre: "", stockInicial: 0 }],
  };
}

/** Crea (id null) o actualiza un producto. Si sale bien, vuelve a la lista. */
export async function guardarProductoAccion(id: number | null, f: FormularioProducto): Promise<ResultadoAccion> {
  await verificarSesion();
  try {
    const datos = validar(f, id === null);
    if (id === null) await crearProducto(datos);
    else await actualizarProducto(id, datos);
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/productos?guardado=${encodeURIComponent(f.nombre.trim())}`);
}

export async function eliminarProductoAccion(id: number): Promise<ResultadoAccion> {
  await verificarSesion();
  try {
    await eliminarProducto(id);
  } catch (e) {
    if (!(e instanceof ErrorNegocio)) console.error(e);
    return { ok: false, error: mensajeDeError(e) };
  }
  revalidatePath("/", "layout");
  redirect("/admin/productos");
}

export async function alternarProductoAccion(id: number, campo: "visible" | "destacado") {
  await verificarSesion();
  if (campo !== "visible" && campo !== "destacado") return;
  await alternarProducto(id, campo);
  revalidatePath("/", "layout");
}
