"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

/** Subir, ordenar y quitar fotos. La primera es la portada. */
export function SubirImagenes({
  imagenes,
  onChange,
  maximo = 8,
}: {
  imagenes: string[];
  onChange: (urls: string[]) => void;
  maximo?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  async function subir(archivos: File[]) {
    setError(null);
    const lugar = maximo - imagenes.length;
    if (archivos.length > lugar) setError(`Máximo ${maximo} fotos: se suben las primeras ${Math.max(0, lugar)}.`);
    const nuevas: string[] = [];
    for (const archivo of archivos.slice(0, Math.max(0, lugar))) {
      setSubiendo((n) => n + 1);
      try {
        const datos = new FormData();
        datos.append("archivo", archivo);
        const res = await fetch("/api/admin/imagenes", { method: "POST", body: datos });
        const json = (await res.json()) as { url?: string; error?: string };
        if (json.url) nuevas.push(json.url);
        else setError(json.error ?? "No se pudo subir la foto.");
      } catch {
        setError("No se pudo subir la foto (¿se cortó la conexión?).");
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
    if (nuevas.length) onChange([...imagenes, ...nuevas]);
  }

  const mover = (i: number, hacia: number) => {
    const copia = [...imagenes];
    [copia[i], copia[i + hacia]] = [copia[i + hacia], copia[i]];
    onChange(copia);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {imagenes.map((url, i) => (
          <div key={url} className="group relative aspect-square border border-line bg-placeholder">
            <Image src={url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute top-1.5 left-1.5 bg-green px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">PORTADA</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70">
              <button type="button" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => mover(i, -1)} className="cursor-pointer p-1.5 hover:text-green disabled:opacity-30">
                <ArrowLeft size={15} />
              </button>
              <button type="button" aria-label="Quitar foto" onClick={() => onChange(imagenes.filter((_, j) => j !== i))} className="cursor-pointer p-1.5 hover:text-red">
                <X size={15} />
              </button>
              <button
                type="button"
                aria-label="Mover a la derecha"
                disabled={i === imagenes.length - 1}
                onClick={() => mover(i, 1)}
                className="cursor-pointer p-1.5 hover:text-green disabled:opacity-30"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: subiendo }, (_, i) => (
          <div key={`subiendo-${i}`} className="flex aspect-square items-center justify-center border border-line bg-panel-2 text-muted">
            <LoaderCircle size={22} className="animate-spin" aria-label="Subiendo" />
          </div>
        ))}
        {imagenes.length + subiendo < maximo && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              subir(Array.from(e.dataTransfer.files));
            }}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-2 text-center text-xs ${
              arrastrando ? "border-green text-green" : "border-line-2 text-muted hover:border-bone hover:text-bone"
            }`}
          >
            <ImagePlus size={22} aria-hidden />
            Agregar fotos
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          subir(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-red">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">JPG, PNG o WEBP. Se achican solas a 1600 px. La primera es la que se ve en el catálogo.</p>
    </div>
  );
}
