import Image from "next/image";
import type { Badge as DatosBadge } from "@/lib/tarjeta";

const TONOS = {
  rojo: "bg-red text-white",
  verde: "bg-green text-ink",
  claro: "bg-bone text-ink",
  gris: "bg-line-2 text-bone",
};

export function Badge({ texto, tono }: DatosBadge) {
  return <span className={`absolute left-2.5 top-2.5 z-10 px-2 py-1 text-[13px] font-black ${TONOS[tono]}`}>{texto}</span>;
}

/** Foto del producto o, si todavía no tiene, el placeholder rayado de la referencia: [ figura ]. */
export function ImagenProducto({
  imagen,
  alt,
  placeholder,
  badge,
  formato = "cuadrada",
  sizes = "(min-width: 1024px) 300px, 50vw",
  preload = false,
}: {
  imagen: string | null;
  alt: string;
  placeholder: string;
  badge?: DatosBadge | null;
  formato?: "cuadrada" | "oferta";
  sizes?: string;
  preload?: boolean;
}) {
  const caja = formato === "cuadrada" ? "box-content aspect-square border-b-4 border-green" : "aspect-[4/3]";
  return (
    <div className={`relative overflow-hidden bg-placeholder ${caja}`}>
      {imagen ? (
        <Image src={imagen} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <span className={`absolute font-mono text-[11px] text-muted ${formato === "cuadrada" ? "bottom-3 left-3" : "bottom-2.5 left-2.5"}`}>
          [ {placeholder} ]
        </span>
      )}
      {badge && <Badge {...badge} />}
    </div>
  );
}
