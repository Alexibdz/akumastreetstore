import { categoria } from "./catalogo";
import { descuento, precio } from "./formato";
import type { Configuracion, ProductoPublico } from "./tipos";
import { linkConsulta } from "./whatsapp";

export type TonoBadge = "rojo" | "verde" | "claro" | "gris";
export type Badge = { texto: string; tono: TonoBadge };

/** Datos listos para dibujar una tarjeta (se pueden pasar a componentes cliente). */
export type DatosTarjeta = {
  slug: string;
  nombre: string;
  serie: string; // la serie, o la categoría si no tiene
  placeholder: string;
  imagen: string | null;
  precio: string | null; // null si los precios están ocultos
  precioAnterior: string | null;
  badge: Badge | null;
  whatsapp: string;
};

export function badgeDe(p: ProductoPublico): Badge | null {
  if (p.stock <= 0 && p.etiqueta !== "PREVENTA") return { texto: "SIN STOCK", tono: "gris" };
  if (p.etiqueta === "PREVENTA") return { texto: "PREVENTA", tono: "claro" };
  if (p.precioAnterior !== null && p.precioAnterior > p.precio) return { texto: descuento(p.precio, p.precioAnterior), tono: "rojo" };
  if (p.etiqueta === "NUEVO") return { texto: "NUEVO", tono: "verde" };
  return null;
}

export function aTarjeta(p: ProductoPublico, config: Configuracion): DatosTarjeta {
  const oferta = p.precioAnterior !== null && p.precioAnterior > p.precio;
  return {
    slug: p.slug,
    nombre: p.nombre,
    serie: p.serie || categoria(p.categoria).nombre,
    placeholder: categoria(p.categoria).placeholder,
    imagen: p.imagenes[0] ?? null,
    precio: config.mostrarPrecios ? precio(p.precio) : null,
    precioAnterior: config.mostrarPrecios && oferta ? precio(p.precioAnterior!) : null,
    badge: badgeDe(p),
    whatsapp: linkConsulta(config.whatsapp, p.nombre, p.serie),
  };
}
