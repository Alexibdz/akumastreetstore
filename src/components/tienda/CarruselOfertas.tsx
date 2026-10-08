"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DatosTarjeta } from "@/lib/tarjeta";
import { ImagenProducto } from "./ImagenProducto";

/**
 * Ofertas del inicio: carrusel que se desliza con el dedo.
 * Entran 1 tarjeta y un poco (celular), 2 (tablet) o 3 (desktop); si sobran, en desktop aparecen flechas.
 */
export function CarruselOfertas({ ofertas }: { ofertas: DatosTarjeta[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const medir = () => {
      const ancho = (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth;
      const fin = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setActual(fin ? ofertas.length - 1 : Math.round(el.scrollLeft / ancho));
      setBordes({ inicio: el.scrollLeft <= 2, fin });
    };
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [ofertas.length]);

  const mover = (sentido: 1 | -1) => {
    const el = pista.current;
    el?.scrollBy({ left: sentido * el.clientWidth, behavior: "smooth" });
  };

  // Según el ancho de las tarjetas (basis de abajo): sobran desde 2 en celular, 3 en tablet y 4 en desktop.
  const puntos = `${ofertas.length > 1 ? "flex" : "hidden"} ${ofertas.length > 2 ? "" : "sm:hidden"} lg:hidden`;
  const flechas = ofertas.length > 3 ? "hidden lg:flex" : "hidden";

  return (
    <section
      aria-labelledby="titulo-ofertas"
      className="mx-[clamp(20px,4vw,48px)] mb-12 grid grid-cols-[minmax(0,1fr)] border-2 border-red lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 bg-red px-5 py-4 text-white lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-6 lg:p-9">
        <div className="flex flex-col gap-1.5 lg:contents">
          <div className="font-mono text-[11px] tracking-[.2em] lg:text-[13px]">HASTA AGOTAR STOCK</div>
          <h2 id="titulo-ofertas" className="font-display text-[30px] leading-[.95] lg:text-[56px]">
            OFER<span className="lg:block">TAS</span>
          </h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Link href="/catalogo?ofertas=1" className="text-[15px] font-black whitespace-nowrap hover:underline">
            Ver todas →
          </Link>
          <div className={`gap-2 ${flechas}`}>
            <button
              type="button"
              aria-label="Ofertas anteriores"
              disabled={bordes.inicio}
              onClick={() => mover(-1)}
              className="size-10 cursor-pointer border-2 border-white text-lg font-black hover:bg-white hover:text-red disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Más ofertas"
              disabled={bordes.fin}
              onClick={() => mover(1)}
              className="size-10 cursor-pointer border-2 border-white text-lg font-black hover:bg-white hover:text-red disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div
          ref={pista}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ofertas.map((t) => (
            <Link
              key={t.slug}
              href={`/producto/${t.slug}`}
              className="group flex shrink-0 grow basis-[78%] snap-start flex-col gap-2.5 border-r border-offer-line p-5 last:border-r-0 sm:max-w-1/2 sm:basis-[45%] sm:p-6 lg:basis-1/3"
            >
              <ImagenProducto
                imagen={t.imagen}
                alt={t.nombre}
                placeholder={t.placeholder}
                badge={t.badge}
                formato="oferta"
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 80vw"
              />
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
        <div aria-hidden className={`justify-center gap-1.5 pb-4 ${puntos}`}>
          {ofertas.map((t, i) => (
            <span key={t.slug} className={`h-1 w-5 transition-colors ${i === actual ? "bg-red" : "bg-line-2"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
