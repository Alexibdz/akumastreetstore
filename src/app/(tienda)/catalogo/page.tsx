import type { Metadata } from "next";
import Link from "next/link";
import { claseChip } from "@/components/tienda/chip";
import { Navegacion } from "@/components/tienda/Navegacion";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";
import { CATEGORIAS, categoria, esCategoria, type CategoriaSlug } from "@/lib/catalogo";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { productosPublicos, seriesPublicas } from "@/lib/db/productos";
import { aTarjeta } from "@/lib/tarjeta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Catálogo" };

type Filtros = { cat?: CategoriaSlug; serie?: string; ofertas?: boolean };

/** Arma /catalogo?... conservando los filtros que no se cambian. */
function url(actual: Filtros, cambios: Partial<Filtros>) {
  const f = { ...actual, ...cambios };
  const p = new URLSearchParams();
  if (f.cat) p.set("cat", f.cat);
  if (f.serie) p.set("serie", f.serie);
  if (f.ofertas) p.set("ofertas", "1");
  const qs = p.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

const texto = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export default async function Catalogo({ searchParams }: PageProps<"/catalogo">) {
  const sp = await searchParams;
  const filtros: Filtros = {
    cat: esCategoria(sp.cat) ? sp.cat : undefined,
    serie: texto(sp.serie),
    ofertas: sp.ofertas === "1",
  };

  const [config, productos, series] = await Promise.all([
    obtenerConfiguracion(),
    productosPublicos({ categoria: filtros.cat, serie: filtros.serie, ofertas: filtros.ofertas }),
    seriesPublicas(filtros.cat),
  ]);

  const titulo = filtros.ofertas
    ? "Ofertas"
    : filtros.cat
      ? categoria(filtros.cat).nombre
      : filtros.serie
        ? filtros.serie
        : "Catálogo";

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <Navegacion config={config} variante="interna" />
      </div>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-gutter pt-12 pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[1.05]">{titulo}</h1>
          <p className="font-mono text-sm text-muted">
            {productos.length} {productos.length === 1 ? "PRODUCTO" : "PRODUCTOS"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2.5">
            <Link href={url(filtros, { cat: undefined, serie: undefined, ofertas: false })} className={claseChip(!filtros.cat && !filtros.ofertas)}>
              Todo
            </Link>
            {CATEGORIAS.map((c) => (
              <Link key={c.slug} href={url(filtros, { cat: c.slug, serie: undefined })} className={claseChip(filtros.cat === c.slug)}>
                {c.nombre}
              </Link>
            ))}
            <Link href={url(filtros, { ofertas: !filtros.ofertas })} className={claseChip(Boolean(filtros.ofertas), { tono: "rojo" })}>
              Ofertas
            </Link>
          </div>
          {series.length > 1 && (
            <div role="group" aria-label="Serie" className="flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-xs tracking-[.12em] text-muted">SERIE</span>
              {series.map((s) => (
                <Link
                  key={s.nombre}
                  href={url(filtros, { serie: filtros.serie === s.nombre ? undefined : s.nombre })}
                  className={claseChip(filtros.serie === s.nombre, { chico: true })}
                >
                  {s.nombre}
                </Link>
              ))}
            </div>
          )}
        </div>

        {productos.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <TarjetaProducto key={p.id} t={aTarjeta(p, config)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 border-2 border-line-2 p-8">
            <p className="font-display text-2xl">No encontramos nada con esos filtros.</p>
            <p className="text-muted">Probá con otros filtros o consultanos por WhatsApp: si no está, capaz lo conseguimos.</p>
            <Link href="/catalogo" className="font-mono text-sm font-bold text-green hover:underline">
              VER TODO EL CATÁLOGO →
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
