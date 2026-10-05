import Image from "next/image";
import Link from "next/link";
import type { Configuracion } from "@/lib/tipos";
import { linkGeneral, linkInstagram } from "@/lib/whatsapp";

export function Pie({ config }: { config: Configuracion }) {
  return (
    <footer className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-line px-gutter py-7 font-mono text-[13px] text-muted">
      <div className="flex items-center gap-3.5">
        <Image src="/akuma-logo.png" alt="" width={40} height={40} className="size-10 rounded-full" />
        <span>AKUMA STREET · TIENDA ANIME</span>
      </div>
      <div className="flex flex-wrap gap-6">
        <a href={linkGeneral(config.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-red">
          WHATSAPP
        </a>
        <a href={linkInstagram(config.instagram)} target="_blank" rel="noopener noreferrer" className="hover:text-red">
          INSTAGRAM
        </a>
        <Link href="/como-comprar" className="hover:text-red">
          CÓMO COMPRAR
        </Link>
      </div>
    </footer>
  );
}
