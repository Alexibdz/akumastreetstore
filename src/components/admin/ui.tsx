import { TriangleAlert, Info } from "lucide-react";

// Piezas visuales del panel. Mismo sistema que la tienda: sin bordes redondeados ni sombras.

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-red text-white hover:brightness-110",
  secundario: "border-2 border-line-2 text-bone hover:border-bone",
  peligro: "border-2 border-red/50 text-red hover:border-red hover:bg-red hover:text-white",
  fantasma: "text-muted hover:text-bone",
};

export const claseBoton = (variante: Variante = "primario", chico = false) =>
  `inline-flex cursor-pointer items-center justify-center gap-2 font-bold tracking-[.04em] whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    chico ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm"
  } ${VARIANTES[variante]}`;

export function Encabezado({ titulo, descripcion, children }: { titulo: string; descripcion?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(26px,3vw,34px)] leading-none">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Tarjeta({
  titulo,
  accion,
  children,
  sinRelleno = false,
}: {
  titulo?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
  sinRelleno?: boolean;
}) {
  return (
    <section className="flex min-w-0 flex-col border border-line bg-panel">
      {titulo && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-bold">{titulo}</h2>
          {accion}
        </div>
      )}
      <div className={sinRelleno ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Etiqueta + control de formulario. */
export function Campo({ etiqueta, ayuda, children, className = "" }: { etiqueta: string; ayuda?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-mono text-[11px] tracking-[.12em] text-muted uppercase">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-muted">{ayuda}</span>}
    </label>
  );
}

export function Aviso({ tipo = "info", children }: { tipo?: "info" | "alerta" | "error"; children: React.ReactNode }) {
  const estilo = {
    info: "border-line-2 text-bone",
    alerta: "border-red/50 text-bone",
    error: "border-red bg-red/10 text-bone",
  }[tipo];
  const Icono = tipo === "info" ? Info : TriangleAlert;
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`flex items-start gap-3 border-l-4 bg-panel px-4 py-3 text-sm ${estilo}`}>
      <Icono size={18} className={`mt-px shrink-0 ${tipo === "info" ? "text-green" : "text-red"}`} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Estado vacío de una lista. */
export function Vacio({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed border-line-2 px-5 py-10 text-center text-sm text-muted">{children}</div>;
}
