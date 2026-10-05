"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIAS } from "@/lib/catalogo";

/** Menú hamburguesa (pantallas de menos de 1280 px). */
export function MenuMovil({ whatsapp, instagram }: { whatsapp: string; instagram: string }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const conEscape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", conEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", conEscape);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button type="button" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(true)} className="-mr-1 p-1 xl:hidden">
        <Menu size={28} strokeWidth={2.25} />
      </button>

      {abierto && (
        <div role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink xl:hidden">
          <div className="flex items-center justify-between px-gutter py-5">
            <Link href="/" onClick={cerrar} aria-label="Inicio">
              <Image src="/akuma-logo.png" alt="" width={44} height={44} className="size-11 rounded-full" />
            </Link>
            <button type="button" aria-label="Cerrar menú" onClick={cerrar} className="-mr-1 p-1">
              <X size={30} strokeWidth={2.25} />
            </button>
          </div>
          <nav aria-label="Categorías" className="flex flex-col border-t border-line">
            {CATEGORIAS.map((c) => (
              <Link
                key={c.slug}
                href={`/catalogo?cat=${c.slug}`}
                onClick={cerrar}
                className="flex items-center justify-between border-b border-line px-gutter py-5 font-display text-[28px] hover:bg-panel hover:text-green"
              >
                {c.nombre}
                <span className="font-sans text-[22px]">→</span>
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-6 px-gutter py-8 text-[15px] font-bold tracking-[.06em]">
            <Link href="/catalogo?ofertas=1" onClick={cerrar} className="text-red">
              OFERTAS
            </Link>
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              INSTAGRAM
            </a>
            <Link href="/como-comprar" onClick={cerrar}>
              CÓMO COMPRAR
            </Link>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="bg-green py-4 text-center font-mono text-sm text-ink">
              WHATSAPP
            </a>
          </div>
        </div>
      )}
    </>
  );
}
