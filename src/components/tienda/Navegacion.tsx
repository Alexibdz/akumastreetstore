import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS } from "@/lib/catalogo";
import type { Configuracion } from "@/lib/tipos";
import { linkGeneral, linkInstagram } from "@/lib/whatsapp";
import { MenuMovil } from "./MenuMovil";

/**
 * Barra de navegación. En el hero va sin logo (el logo está al centro);
 * en el resto de las páginas lleva el logo chico y una línea abajo.
 */
export function Navegacion({ config, variante }: { config: Configuracion; variante: "hero" | "interna" }) {
  const whatsapp = linkGeneral(config.whatsapp);
  const instagram = linkInstagram(config.instagram);

  return (
    <header className={`relative ${variante === "interna" ? "border-b border-line" : ""}`}>
      <nav
        aria-label="Principal"
        className={`flex items-center justify-between gap-4 px-gutter text-[15px] font-bold tracking-[.06em] ${variante === "hero" ? "py-7" : "py-5"}`}
      >
        <div className="flex items-center gap-8">
          {variante === "interna" && (
            <Link href="/" aria-label="Akuma Street, inicio" className="shrink-0">
              <Image src="/akuma-logo.png" alt="" width={44} height={44} className="size-11 rounded-full" />
            </Link>
          )}
          <div className="hidden gap-8 xl:flex">
            {CATEGORIAS.map((c) => (
              <Link key={c.slug} href={`/catalogo?cat=${c.slug}`} className="whitespace-nowrap hover:text-red">
                {c.nombre.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/catalogo?ofertas=1" className="hidden text-red hover:opacity-80 xl:inline">
            OFERTAS
          </Link>
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="hidden hover:text-red xl:inline">
            INSTAGRAM
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green px-4 py-2.5 font-mono text-sm text-ink hover:brightness-110"
          >
            WHATSAPP
          </a>
          <MenuMovil whatsapp={whatsapp} instagram={instagram} />
        </div>
      </nav>
    </header>
  );
}
