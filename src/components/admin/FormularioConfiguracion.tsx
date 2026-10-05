"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { guardarConfiguracionAccion } from "@/app/admin/(panel)/configuracion/acciones";
import type { Configuracion } from "@/lib/tipos";
import { linkGeneral } from "@/lib/whatsapp";
import { Campo, Tarjeta, claseBoton } from "./ui";

export function FormularioConfiguracion({ inicial }: { inicial: Configuracion }) {
  const [c, setC] = useState(inicial);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, iniciar] = useTransition();
  const cambiar = <K extends keyof Configuracion>(k: K, v: Configuracion[K]) => {
    setResultado(null);
    setC((x) => ({ ...x, [k]: v }));
  };

  function guardar() {
    iniciar(async () => {
      const r = await guardarConfiguracionAccion(c);
      if (r) setResultado(r.ok ? { ok: true, texto: r.mensaje ?? "Guardado." } : { ok: false, texto: r.error });
    });
  }

  const numero = c.whatsapp.replace(/\D/g, "");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Tarjeta titulo="Contacto">
          <div className="flex flex-col gap-4">
            <Campo etiqueta="WhatsApp de la tienda" ayuda="Con código de país y de área, sin 0 ni 15: 549 + 11 + número → 5491112345678.">
              <div className="flex">
                <input value={c.whatsapp} onChange={(e) => cambiar("whatsapp", e.target.value)} inputMode="tel" className="campo font-mono" />
                <a
                  href={linkGeneral(numero)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 border-2 border-l-0 border-line-2 px-3 text-xs font-bold hover:border-bone"
                >
                  Probar <ExternalLink size={13} aria-hidden />
                </a>
              </div>
            </Campo>
            <Campo etiqueta="Usuario de Instagram" ayuda="Sin @. Se usa en el inicio y en los links de la web.">
              <input value={c.instagram} onChange={(e) => cambiar("instagram", e.target.value)} className="campo font-mono" />
            </Campo>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Tienda y stock">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={c.mostrarPrecios}
                onChange={(e) => cambiar("mostrarPrecios", e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--color-green)]"
              />
              <span>
                Mostrar los precios en la web
                <span className="block text-xs text-muted">Si lo apagás, se ve «Consultá el precio por WhatsApp».</span>
              </span>
            </label>
            <Campo etiqueta="Avisar stock bajo con" ayuda="Unidades por producto o talle. Aparece en el inicio del panel y en Stock.">
              <input
                type="number"
                min={0}
                max={1000}
                value={c.umbralStockBajo}
                onChange={(e) => cambiar("umbralStockBajo", Number(e.target.value))}
                className="campo w-28 font-mono"
              />
            </Campo>
          </div>
        </Tarjeta>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-line bg-ink py-4">
        <button type="button" onClick={guardar} disabled={guardando} className={claseBoton()}>
          {guardando ? "GUARDANDO…" : "GUARDAR CAMBIOS"}
        </button>
        {resultado && (
          <p role={resultado.ok ? "status" : "alert"} className={`text-sm ${resultado.ok ? "text-green" : "text-red"}`}>
            {resultado.texto}
          </p>
        )}
      </div>
    </div>
  );
}
