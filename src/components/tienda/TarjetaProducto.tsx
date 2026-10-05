import Link from "next/link";
import type { DatosTarjeta } from "@/lib/tarjeta";
import { ImagenProducto } from "./ImagenProducto";

export function TarjetaProducto({ t }: { t: DatosTarjeta }) {
  return (
    <article className="flex h-full flex-col gap-3">
      <Link href={`/producto/${t.slug}`} tabIndex={-1} aria-hidden>
        <ImagenProducto imagen={t.imagen} alt={t.nombre} placeholder={t.placeholder} badge={t.badge} />
      </Link>
      <div className="font-mono text-xs uppercase tracking-[.08em] text-muted">{t.serie}</div>
      <Link href={`/producto/${t.slug}`} className="text-base font-bold leading-[1.25] hover:text-red">
        {t.nombre}
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2">
        {t.precio && <span className="font-mono text-[15px] font-bold text-red">{t.precio}</span>}
        <a
          href={t.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[13px] font-bold whitespace-nowrap text-green hover:underline"
        >
          CONSULTAR →
        </a>
      </div>
    </article>
  );
}
