import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsultarProducto } from "@/components/tienda/ConsultarProducto";
import { GaleriaProducto } from "@/components/tienda/GaleriaProducto";
import { Navegacion } from "@/components/tienda/Navegacion";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";
import { categoria } from "@/lib/catalogo";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { enOferta, productoPublico, productosPublicos } from "@/lib/db/productos";
import { descuento, precio } from "@/lib/formato";
import { aTarjeta, badgeDe } from "@/lib/tarjeta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await productoPublico(slug);
  if (!p) return { title: "Producto no encontrado" };
  const descripcion = p.descripcion || `${p.nombre}${p.serie ? ` · ${p.serie}` : ""}`;
  return {
    title: p.nombre,
    description: descripcion,
    openGraph: { title: p.nombre, description: descripcion, images: [p.imagenes[0] ?? "/akuma-logo.png"] },
  };
}

export default async function ProductoPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const [p, config] = await Promise.all([productoPublico(slug), obtenerConfiguracion()]);
  if (!p) notFound();

  const cat = categoria(p.categoria);
  // Relacionados: misma serie y, si faltan, misma categoría
  const deLaSerie = p.serie ? await productosPublicos({ serie: p.serie }) : [];
  const deLaCategoria = await productosPublicos({ categoria: p.categoria });
  const relacionados = [...deLaSerie, ...deLaCategoria]
    .filter((x, i, todos) => x.id !== p.id && todos.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4);

  const talles = p.variantes.filter((v) => v.nombre).map((v) => ({ nombre: v.nombre, stock: v.stock }));
  const estado =
    p.etiqueta === "PREVENTA"
      ? { texto: "PREVENTA · RESERVÁ EL TUYO", color: "text-bone" }
      : p.stock <= 0
        ? { texto: "SIN STOCK · CONSULTÁ SI VUELVE", color: "text-muted" }
        : p.stock <= config.umbralStockBajo
          ? { texto: "ÚLTIMAS UNIDADES", color: "text-red" }
          : { texto: "EN STOCK", color: "text-green" };

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <Navegacion config={config} variante="interna" />
      </div>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-gutter pt-8 pb-20">
        <div className="flex flex-col gap-6">
          <nav aria-label="Ubicación" className="flex flex-wrap gap-2 font-mono text-xs tracking-[.08em] text-muted">
            <Link href="/catalogo" className="hover:text-red">
              CATÁLOGO
            </Link>
            <span>/</span>
            <Link href={`/catalogo?cat=${cat.slug}`} className="hover:text-red">
              {cat.nombre.toUpperCase()}
            </Link>
            <span>/</span>
            <span className="text-bone">{p.nombre.toUpperCase()}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
            <GaleriaProducto imagenes={p.imagenes} nombre={p.nombre} placeholder={cat.placeholder} badge={badgeDe(p)} />

            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-3">
                {p.serie && (
                  <Link href={`/catalogo?serie=${encodeURIComponent(p.serie)}`} className="w-fit font-mono text-[13px] uppercase tracking-[.12em] text-muted hover:text-red">
                    {p.serie}
                  </Link>
                )}
                <h1 className="font-display text-[clamp(30px,4vw,46px)] leading-[1.08]">{p.nombre}</h1>
              </div>

              {config.mostrarPrecios ? (
                <div className="flex flex-wrap items-baseline gap-4 font-mono">
                  <span className="text-[32px] font-bold text-red">{precio(p.precio)}</span>
                  {enOferta(p) && (
                    <>
                      <span className="text-lg text-muted line-through">{precio(p.precioAnterior!)}</span>
                      <span className="bg-red px-2 py-1 font-sans text-[13px] font-black text-white">{descuento(p.precio, p.precioAnterior!)}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="font-mono text-sm tracking-[.08em] text-muted">CONSULTÁ EL PRECIO POR WHATSAPP</p>
              )}

              <p className={`font-mono text-[13px] font-bold tracking-[.12em] ${estado.color}`}>● {estado.texto}</p>

              <ConsultarProducto numero={config.whatsapp} nombre={p.nombre} serie={p.serie} talles={talles} />

              {p.descripcion && <p className="text-base leading-relaxed whitespace-pre-line text-bone/85">{p.descripcion}</p>}

              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-5 font-mono text-xs tracking-[.08em]">
                <dt className="text-muted">CATEGORÍA</dt>
                <dd>
                  <Link href={`/catalogo?cat=${cat.slug}`} className="hover:text-red">
                    {cat.nombre.toUpperCase()}
                  </Link>
                </dd>
                {p.serie && (
                  <>
                    <dt className="text-muted">SERIE</dt>
                    <dd>{p.serie.toUpperCase()}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>

        {relacionados.length > 0 && (
          <section aria-labelledby="titulo-relacionados" className="flex flex-col gap-7">
            <h2 id="titulo-relacionados" className="font-display text-[clamp(26px,4vw,34px)] leading-[1.1]">
              {p.serie && relacionados.every((r) => r.serie === p.serie) ? `Más de ${p.serie}` : "También te puede gustar"}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {relacionados.map((r) => (
                <TarjetaProducto key={r.id} t={aTarjeta(r, config)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
