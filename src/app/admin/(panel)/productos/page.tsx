import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Plus, Search, Star } from "lucide-react";
import { Aviso, Encabezado, Vacio, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CATEGORIAS, categoria, esCategoria } from "@/lib/catalogo";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { productosAdmin } from "@/lib/db/productos";
import { descuento, precio } from "@/lib/formato";
import { alternarProductoAccion } from "./acciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Productos" };

export default async function Productos({ searchParams }: PageProps<"/admin/productos">) {
  await verificarSesion();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = esCategoria(sp.cat) ? sp.cat : undefined;
  const guardado = typeof sp.guardado === "string" ? sp.guardado : null;
  const [productos, config] = await Promise.all([productosAdmin({ q: q || undefined, categoria: cat }), obtenerConfiguracion()]);

  const url = (cambios: { cat?: string | null }) => {
    const p = new URLSearchParams();
    const c = cambios.cat === undefined ? cat : cambios.cat;
    if (c) p.set("cat", c);
    if (q) p.set("q", q);
    return `/admin/productos${p.size ? `?${p}` : ""}`;
  };
  const chip = (activo: boolean) =>
    `border-2 px-3 py-1.5 text-[13px] font-bold ${activo ? "border-green bg-green text-ink" : "border-line-2 hover:border-bone"}`;

  return (
    <>
      <Encabezado titulo="Productos" descripcion={`${productos.length} ${productos.length === 1 ? "producto" : "productos"}${cat ? ` en ${categoria(cat).nombre}` : ""}`}>
        <Link href="/admin/productos/nuevo" className={claseBoton()}>
          <Plus size={16} strokeWidth={3} aria-hidden /> Nuevo producto
        </Link>
      </Encabezado>

      {guardado && <Aviso>«{guardado}» quedó guardado.</Aviso>}

      <div className="flex flex-col gap-3">
        <form className="flex max-w-xl" role="search">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" type="search" defaultValue={q} placeholder="Buscar por nombre, serie o descripción…" aria-label="Buscar productos" className="campo" />
          <button type="submit" aria-label="Buscar" className="border-2 border-l-0 border-line-2 px-3 hover:border-bone">
            <Search size={16} />
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Link href={url({ cat: null })} className={chip(!cat)}>
            Todo
          </Link>
          {CATEGORIAS.map((c) => (
            <Link key={c.slug} href={url({ cat: c.slug })} className={chip(cat === c.slug)}>
              {c.nombre}
            </Link>
          ))}
        </div>
      </div>

      {productos.length === 0 ? (
        <Vacio>
          No hay productos.{" "}
          <Link href="/admin/productos/nuevo" className="text-green underline">
            Cargar el primero
          </Link>
        </Vacio>
      ) : (
        <div className="relative overflow-x-auto border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-panel font-mono text-[11px] tracking-[.1em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Producto</th>
                <th className="px-4 py-3 font-normal">Categoría</th>
                <th className="px-4 py-3 text-right font-normal">Precio</th>
                <th className="px-4 py-3 text-right font-normal">Costo</th>
                <th className="px-4 py-3 font-normal">Stock</th>
                <th className="px-4 py-3 text-center font-normal">Web</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {productos.map((p) => {
                const bajo = p.etiqueta !== "PREVENTA" && p.variantes.some((v) => v.stock <= config.umbralStockBajo);
                return (
                  <tr key={p.id} className={`hover:bg-panel ${p.visible ? "" : "opacity-60"}`}>
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/productos/${p.id}`} className="group flex items-center gap-3">
                        <span className="relative size-12 shrink-0 bg-placeholder">
                          {p.imagenes[0] && <Image src={p.imagenes[0]} alt="" fill sizes="48px" className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold group-hover:text-green">{p.nombre}</span>
                          <span className="font-mono text-[11px] text-muted uppercase">
                            {p.serie || "Sin serie"}
                            {p.etiqueta && <span className="ml-2 text-bone">{p.etiqueta}</span>}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted">{categoria(p.categoria).nombre}</td>
                    <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap tabular-nums">
                      {precio(p.precio)}
                      {p.precioAnterior !== null && p.precioAnterior > p.precio && (
                        <span className="ml-2 bg-red px-1 py-0.5 font-sans text-[11px] font-black text-white">{descuento(p.precio, p.precioAnterior)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-muted tabular-nums">{p.costo !== null ? precio(p.costo) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/stock?q=${encodeURIComponent(p.nombre)}`} className="font-mono text-xs hover:text-green">
                        <span className={`font-bold ${bajo ? "text-red" : ""}`}>{p.stock}</span>
                        {p.variantes.some((v) => v.nombre) && (
                          <span className="ml-2 text-muted">{p.variantes.map((v) => `${v.nombre} ${v.stock}`).join(" · ")}</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-center gap-1">
                        <form action={alternarProductoAccion.bind(null, p.id, "visible")}>
                          <button
                            type="submit"
                            title={p.visible ? "Visible en la web (tocá para ocultar)" : "Oculto (tocá para mostrar)"}
                            aria-label={p.visible ? `Ocultar ${p.nombre}` : `Mostrar ${p.nombre}`}
                            className={`cursor-pointer p-1.5 ${p.visible ? "text-green" : "text-muted"} hover:text-bone`}
                          >
                            {p.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                          </button>
                        </form>
                        <form action={alternarProductoAccion.bind(null, p.id, "destacado")}>
                          <button
                            type="submit"
                            title={p.destacado ? "Destacado (tocá para quitar)" : "Destacar"}
                            aria-label={p.destacado ? `Quitar destacado a ${p.nombre}` : `Destacar ${p.nombre}`}
                            className={`cursor-pointer p-1.5 ${p.destacado ? "text-bone" : "text-muted/60"} hover:text-bone`}
                          >
                            <Star size={17} fill={p.destacado ? "currentColor" : "none"} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
