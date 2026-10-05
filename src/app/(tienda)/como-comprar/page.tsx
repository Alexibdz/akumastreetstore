import type { Metadata } from "next";
import Link from "next/link";
import { Navegacion } from "@/components/tienda/Navegacion";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { linkGeneral } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cómo comprar" };

const PASOS = [
  { titulo: "Elegí", texto: "Recorré el catálogo y tocá CONSULTAR en el producto que te guste (si es ropa, elegí el talle antes)." },
  { titulo: "Consultá", texto: "Se abre WhatsApp con el producto ya escrito. Te confirmamos stock, talle y precio final." },
  { titulo: "Pagá", texto: "Coordinamos el pago por el medio que te quede más cómodo. Preguntanos por cuotas y promos." },
  { titulo: "Recibilo", texto: "Hacemos envíos a todo el país o lo retirás, lo que te sirva más." },
];

export default async function ComoComprar() {
  const config = await obtenerConfiguracion();
  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <Navegacion config={config} variante="interna" />
      </div>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-12 px-gutter pt-12 pb-20">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[13px] tracking-[.2em] text-muted">SIN CARRITO, SIN VUELTAS</p>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[1.05]">Cómo comprar</h1>
        </div>
        <ol className="grid border-t border-l border-line sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="flex flex-col gap-4 border-r border-b border-line p-8">
              <span className="font-display text-[56px] leading-none text-transparent [-webkit-text-stroke:2px_var(--color-green)]">{i + 1}</span>
              <h2 className="font-display text-[28px] leading-none">{p.titulo}</h2>
              <p className="leading-relaxed text-bone/85">{p.texto}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-4">
          <a
            href={linkGeneral(config.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red px-8 py-[18px] text-base font-black tracking-[.05em] text-white hover:brightness-110"
          >
            ESCRIBINOS POR WHATSAPP
          </a>
          <Link href="/catalogo" className="border-2 border-bone px-[30px] py-4 text-base font-black tracking-[.05em] hover:text-red">
            VER CATÁLOGO
          </Link>
        </div>
      </main>
    </>
  );
}
