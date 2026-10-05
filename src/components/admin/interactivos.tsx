"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { mesAR, nombreMes, sumarMeses } from "@/lib/formato";

/** Lo que devuelve una acción de formulario. */
export type EstadoAccion = { ok: true; mensaje?: string } | { ok: false; error: string };
/** Igual, pero puede no devolver nada (cuando redirige). */
export type ResultadoAccion = EstadoAccion | void;

/** Botón que pide confirmación antes de ejecutar una acción del servidor (anular, borrar...). */
export function BotonConfirmar({
  accion,
  pregunta,
  className,
  children,
}: {
  accion: () => Promise<ResultadoAccion>;
  pregunta: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pendiente}
        className={className}
        onClick={() => {
          if (!window.confirm(pregunta)) return;
          setError(null);
          iniciar(async () => {
            const r = await accion();
            if (r && !r.ok) setError(r.error);
          });
        }}
      >
        {children}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red">
          {error}
        </span>
      )}
    </span>
  );
}

/** ‹ octubre 2026 › con selector nativo de mes. */
export function SelectorMes({ mes, ruta, extra = {} }: { mes: string; ruta: string; extra?: Record<string, string> }) {
  const router = useRouter();
  const href = (m: string) => `${ruta}?${new URLSearchParams({ ...extra, mes: m })}`;
  const esActual = mes >= mesAR();
  const flecha = "flex items-center border-2 border-line-2 px-2 hover:border-bone";
  return (
    <div className="flex items-stretch">
      <Link href={href(sumarMeses(mes, -1))} aria-label="Mes anterior" className={flecha}>
        <ChevronLeft size={18} />
      </Link>
      <label className="relative flex items-center border-y-2 border-line-2 px-4 text-sm font-bold">
        <span className="pointer-events-none">{nombreMes(mes).replace(/^./, (c) => c.toUpperCase())}</span>
        <input
          type="month"
          value={mes}
          max={mesAR()}
          onChange={(e) => e.target.value && router.push(href(e.target.value))}
          aria-label="Elegir mes"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {esActual ? (
        <span className={`${flecha} pointer-events-none opacity-30`} aria-hidden>
          <ChevronRight size={18} />
        </span>
      ) : (
        <Link href={href(sumarMeses(mes, 1))} aria-label="Mes siguiente" className={flecha}>
          <ChevronRight size={18} />
        </Link>
      )}
    </div>
  );
}

/** Diálogo modal nativo (<dialog>): botón que lo abre + contenido. */
export function Dialogo({
  boton,
  claseBoton,
  titulo,
  children,
}: {
  boton: React.ReactNode;
  claseBoton: string;
  titulo: string;
  children: (cerrar: () => void) => React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  // El estado manda: el <dialog> nativo se abre o se cierra para seguirlo
  useEffect(() => {
    if (abierto) ref.current?.showModal();
    else ref.current?.close();
  }, [abierto]);
  return (
    <>
      <button type="button" className={claseBoton} onClick={() => setAbierto(true)}>
        {boton}
      </button>
      <dialog
        ref={ref}
        onClose={() => setAbierto(false)}
        className="m-auto w-[min(440px,calc(100vw-32px))] border border-line-2 bg-panel p-0 text-bone backdrop:bg-black/70"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-bold">{titulo}</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="cursor-pointer text-muted hover:text-bone">
            <X size={18} />
          </button>
        </div>
        {/* El contenido se monta al abrir: cada apertura arranca con el formulario limpio */}
        <div className="p-5">{abierto && children(cerrar)}</div>
      </dialog>
    </>
  );
}
