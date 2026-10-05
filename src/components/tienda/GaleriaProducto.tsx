"use client";

import Image from "next/image";
import { useState } from "react";
import type { Badge } from "@/lib/tarjeta";
import { ImagenProducto } from "./ImagenProducto";

export function GaleriaProducto({
  imagenes,
  nombre,
  placeholder,
  badge,
}: {
  imagenes: string[];
  nombre: string;
  placeholder: string;
  badge: Badge | null;
}) {
  const [actual, setActual] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <ImagenProducto
        imagen={imagenes[actual] ?? null}
        alt={nombre}
        placeholder={placeholder}
        badge={badge}
        sizes="(min-width: 1024px) 640px, 100vw"
        preload
      />
      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === actual}
              className={`relative aspect-square cursor-pointer bg-placeholder ${i === actual ? "outline-2 outline-green" : "opacity-60 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
