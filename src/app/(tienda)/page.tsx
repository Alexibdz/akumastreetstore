import Image from "next/image";
import Link from "next/link";
import { FiltroSeries, type GrupoSerie } from "@/components/tienda/FiltroSeries";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";
import { Navegacion } from "@/components/tienda/Navegacion";
import { CATEGORIAS } from "@/lib/catalogo";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { enOferta, productosPublicos, seriesPublicas } from "@/lib/db/productos";
import { aTarjeta } from "@/lib/tarjeta";

// Lee la base en cada visita (precios y stock al día).
export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [config, productos, series] = await Promise.all([obtenerConfiguracion(), productosPublicos(), seriesPublicas()]);
  const tarjeta = (p: (typeof productos)[number]) => aTarjeta(p, config);

  const grupos: GrupoSerie[] = [
    { nombre: "Todas", cantidad: productos.length, href: "/catalogo", tarjetas: productos.slice(0, 4).map(tarjeta) },
    ...series.map((s) => {
      const deLaSerie = productos.filter((p) => p.serie === s.nombre);
      return {
        nombre: s.nombre,
        cantidad: deLaSerie.length,
        href: `/catalogo?serie=${encodeURIComponent(s.nombre)}`,
        tarjetas: deLaSerie.slice(0, 4).map(tarjeta),
      };
    }),
  ];
  const ofertas = productos.filter(enOferta).slice(0, 3).map(tarjeta);

  return (
    <main>
      {/* Hero */}
      <section className="relative mx-auto flex h-[680px] max-w-[1280px] flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(240px,40vw,520px)] leading-none tracking-[-.05em] whitespace-nowrap opacity-30 select-none text-outline-green"
        >
          悪魔
        </div>
        <Navegacion config={config} variante="hero" />
        <div className="relative flex flex-1 flex-col items-center justify-center gap-7 pb-10 text-center">
          <Image
            src="/akuma-logo.png"
            alt="Akuma Street"
            width={280}
            height={280}
            preload
            className="size-[clamp(180px,22vw,280px)] rounded-full"
          />
          <h1 className="px-6 font-display text-[clamp(36px,4.7vw,60px)] leading-none text-balance">
            AKUMA <span className="text-red">STREET</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4 px-5">
            <Link href="/catalogo" className="bg-red px-8 py-[18px] text-base font-black tracking-[.05em] text-white hover:brightness-110">
              VER CATÁLOGO
            </Link>
            <Link
              href="/catalogo?ofertas=1"
              className="border-2 border-bone px-[30px] py-4 text-base font-black tracking-[.05em] hover:text-red"
            >
              OFERTAS
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px]">
        {/* Categorías */}
        <nav aria-label="Categorías" className="grid grid-cols-2 border-y border-line md:grid-cols-3">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogo?cat=${c.slug}`}
              className="-mb-px flex items-center justify-between gap-3 border-r border-b border-line px-[clamp(16px,3vw,40px)] py-8 transition-colors hover:bg-panel hover:text-green"
            >
              <span className="font-display text-[clamp(19px,2.2vw,28px)] leading-tight">{c.nombre}</span>
              <span className="text-[22px]">→</span>
            </Link>
          ))}
        </nav>

        {productos.length > 0 && <FiltroSeries grupos={grupos} />}

        {/* Ofertas */}
        {ofertas.length > 0 && (
          <section
            aria-labelledby="titulo-ofertas"
            className="mx-[clamp(20px,4vw,48px)] my-12 grid border-2 border-red lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)]"
          >
            <div className="flex flex-col justify-between gap-6 bg-red p-9 text-white">
              <div className="font-mono text-[13px] tracking-[.2em]">HASTA AGOTAR STOCK</div>
              <h2 id="titulo-ofertas" className="font-display text-[56px] leading-[.95]">
                OFER
                <br />
                TAS
              </h2>
              <Link href="/catalogo?ofertas=1" className="text-[15px] font-black hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="grid divide-y divide-offer-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {ofertas.map((t) => (
                <Link key={t.slug} href={`/producto/${t.slug}`} className="group flex flex-col gap-2.5 p-6">
                  <ImagenProducto imagen={t.imagen} alt={t.nombre} placeholder={t.placeholder} badge={t.badge} formato="oferta" />
                  <div className="text-base font-bold leading-[1.25] group-hover:text-red">{t.nombre}</div>
                  {t.precio && (
                    <div className="flex items-baseline gap-3 font-mono">
                      <span className="text-base font-bold text-red">{t.precio}</span>
                      {t.precioAnterior && <span className="text-[13px] text-muted line-through">{t.precioAnterior}</span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
