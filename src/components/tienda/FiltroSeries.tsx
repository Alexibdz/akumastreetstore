"use client";

import Link from "next/link";
import { useState } from "react";
import type { DatosTarjeta } from "@/lib/tarjeta";
import { claseChip } from "./chip";
import { TarjetaProducto } from "./TarjetaProducto";

export type GrupoSerie = { nombre: string; cantidad: number; href: string; tarjetas: DatosTarjeta[] };

/** "Buscar por serie" del inicio: chips que filtran la grilla (muestra hasta 4 productos). */
export function FiltroSeries({ grupos }: { grupos: GrupoSerie[] }) {
  const [activo, setActivo] = useState(0);
  const grupo = grupos[activo];

  return (
    <section aria-labelledby="titulo-series" className="flex flex-col gap-7 px-gutter pt-16 pb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="titulo-series" className="font-display text-[clamp(30px,5vw,40px)] leading-[1.1]">
          Buscar por serie
        </h2>
        <Link href={grupo.href} className="font-mono text-sm text-muted hover:text-red">
          {grupo.cantidad} {grupo.cantidad === 1 ? "PRODUCTO" : "PRODUCTOS"}
        </Link>
      </div>
      <div role="group" aria-label="Series" className="flex flex-wrap gap-2.5">
        {grupos.map((g, i) => (
          <button key={g.nombre} type="button" aria-pressed={i === activo} onClick={() => setActivo(i)} className={`cursor-pointer ${claseChip(i === activo)}`}>
            {g.nombre}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-6 lg:grid-cols-4">
        {grupo.tarjetas.map((t) => (
          <TarjetaProducto key={t.slug} t={t} />
        ))}
      </div>
    </section>
  );
}
