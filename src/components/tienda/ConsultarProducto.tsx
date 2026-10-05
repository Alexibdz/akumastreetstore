"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { linkConsulta } from "@/lib/whatsapp";
import { claseChip } from "./chip";

/** Selector de talle (si tiene) + botón grande de WhatsApp con el producto y el talle ya escritos. */
export function ConsultarProducto({
  numero,
  nombre,
  serie,
  talles,
}: {
  numero: string;
  nombre: string;
  serie: string;
  talles: { nombre: string; stock: number }[];
}) {
  const [talle, setTalle] = useState(talles.find((t) => t.stock > 0)?.nombre ?? talles[0]?.nombre);

  return (
    <div className="flex flex-col gap-5">
      {talles.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs tracking-[.12em] text-muted">TALLE</span>
          <div role="group" aria-label="Talle" className="flex flex-wrap gap-2">
            {talles.map((t) => (
              <button
                key={t.nombre}
                type="button"
                aria-pressed={talle === t.nombre}
                onClick={() => setTalle(t.nombre)}
                title={t.stock > 0 ? undefined : "Sin stock: consultá si vuelve"}
                className={`min-w-14 cursor-pointer ${claseChip(talle === t.nombre)} ${t.stock > 0 ? "" : "line-through decoration-2 opacity-60"}`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
      <a
        href={linkConsulta(numero, nombre, serie, talles.length > 0 ? talle : undefined)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 bg-red px-8 py-5 text-center text-lg font-black tracking-[.05em] text-white hover:brightness-110"
      >
        <MessageCircle size={22} strokeWidth={2.5} aria-hidden />
        CONSULTAR POR WHATSAPP
      </a>
    </div>
  );
}
