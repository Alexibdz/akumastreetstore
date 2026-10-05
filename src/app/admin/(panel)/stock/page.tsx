import type { Metadata } from "next";
import Link from "next/link";
import { History, Search } from "lucide-react";
import { AccionesStock } from "@/components/admin/AccionesStock";
import { Indicador } from "@/components/admin/datos";
import { Encabezado, Vacio, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CATEGORIAS, categoria, esCategoria } from "@/lib/catalogo";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { filasStock, valorInventario } from "@/lib/db/stock";
import { numero, precio } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stock" };

export default async function Stock({ searchParams }: PageProps<"/admin/stock">) {
  await verificarSesion();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = esCategoria(sp.cat) ? sp.cat : undefined;
  const soloBajo = sp.bajo === "1";
  const config = await obtenerConfiguracion();
  const [filas, valor, bajos] = await Promise.all([
    filasStock({ q: q || undefined, categoria: cat, bajoHasta: soloBajo ? config.umbralStockBajo : undefined }),
    valorInventario(),
    filasStock({ bajoHasta: config.umbralStockBajo }),
  ]);
  const cantidadBajos = bajos.filter((f) => !f.preventa && f.visible).length;

  const url = (cambios: { cat?: string | null; bajo?: boolean }) => {
    const p = new URLSearchParams();
    const c = cambios.cat === undefined ? cat : cambios.cat;
    const b = cambios.bajo === undefined ? soloBajo : cambios.bajo;
    if (c) p.set("cat", c);
    if (b) p.set("bajo", "1");
    if (q) p.set("q", q);
    return `/admin/stock${p.size ? `?${p}` : ""}`;
  };
  const chip = (activo: boolean, rojo = false) =>
    `border-2 px-3 py-1.5 text-[13px] font-bold ${activo ? (rojo ? "border-red bg-red text-white" : "border-green bg-green text-ink") : "border-line-2 hover:border-bone"}`;

  return (
    <>
      <Encabezado titulo="Stock" descripcion="Cada ingreso, venta o ajuste queda en el historial.">
        <Link href="/admin/stock/movimientos" className={claseBoton("secundario")}>
          <History size={16} aria-hidden /> Historial
        </Link>
      </Encabezado>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta="Unidades en stock" valor={numero(valor.unidades)} />
        <Indicador
          etiqueta="Stock valorizado al costo"
          valor={precio(valor.aCosto)}
          detalle={valor.sinCosto > 0 ? `${valor.sinCosto} productos sin costo cargado no suman` : undefined}
        />
        <Indicador etiqueta="A precio de venta" valor={precio(valor.aPrecio)} detalle="Lo que entraría si vendieras todo" />
        <Indicador etiqueta={`Stock bajo (${config.umbralStockBajo} o menos)`} valor={String(cantidadBajos)} detalle="Talles o productos para reponer" />
      </div>

      <div className="flex flex-col gap-3">
        <form className="flex max-w-xl" role="search">
          {cat && <input type="hidden" name="cat" value={cat} />}
          {soloBajo && <input type="hidden" name="bajo" value="1" />}
          <input name="q" type="search" defaultValue={q} placeholder="Buscar producto, talle o serie…" aria-label="Buscar en el stock" className="campo" />
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
          <Link href={url({ bajo: !soloBajo })} className={chip(soloBajo, true)}>
            Solo stock bajo
          </Link>
        </div>
      </div>

      {filas.length === 0 ? (
        <Vacio>No hay nada con esos filtros.</Vacio>
      ) : (
        <div className="relative overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-panel font-mono text-[11px] tracking-[.1em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Producto</th>
                <th className="px-4 py-3 font-normal">Categoría</th>
                <th className="px-4 py-3 text-right font-normal">Stock</th>
                <th className="px-4 py-3 text-right font-normal">Costo</th>
                <th className="px-4 py-3 text-right font-normal">Valor al costo</th>
                <th className="px-4 py-3 font-normal">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filas.map((f) => {
                const bajo = !f.preventa && f.stock <= config.umbralStockBajo;
                const descripcion = f.talle ? `${f.producto} (${f.talle})` : f.producto;
                return (
                  <tr key={f.varianteId} className={`hover:bg-panel ${f.visible ? "" : "opacity-60"}`}>
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/productos/${f.productoId}`} className="font-bold hover:text-green">
                        {f.producto}
                      </Link>
                      {f.talle && <span className="ml-2 border border-line-2 px-1.5 py-0.5 font-mono text-[11px]">{f.talle}</span>}
                      {f.preventa && <span className="ml-2 font-mono text-[11px] text-muted">PREVENTA</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted">{categoria(f.categoria).nombre}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-mono text-base font-bold tabular-nums ${bajo ? "text-red" : ""}`}>{f.stock}</span>
                      {f.stock < 0 && <span className="block text-[11px] text-muted">reservados</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted tabular-nums">{f.costo !== null ? precio(f.costo) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{f.costo !== null && f.stock > 0 ? precio(f.costo * f.stock) : "—"}</td>
                    <td className="px-4 py-2.5">
                      <AccionesStock fila={{ varianteId: f.varianteId, descripcion, stock: f.stock, costo: f.costo }} />
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
