"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { crearGastoAccion } from "@/app/admin/(panel)/gastos/acciones";
import { CATEGORIAS_GASTO } from "@/lib/catalogo";
import { Campo, claseBoton } from "./ui";

export function FormularioGasto({ hoy }: { hoy: string }) {
  const [estado, accion, enviando] = useActionState(crearGastoAccion, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} action={accion} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Fecha">
          <input type="date" name="fecha" defaultValue={hoy} max={hoy} required className="campo" />
        </Campo>
        <Campo etiqueta="Categoría">
          <select name="categoria" defaultValue="mercaderia" className="campo">
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Descripción">
        <input name="descripcion" maxLength={200} placeholder="Ej.: alquiler de octubre, bolsas, envío a cliente…" className="campo" />
      </Campo>
      <Campo etiqueta="Monto $">
        <input name="monto" inputMode="numeric" required placeholder="0" className="campo font-mono" />
      </Campo>
      {estado && !estado.ok && (
        <p role="alert" className="text-sm text-red">
          {estado.error}
        </p>
      )}
      {estado?.ok && <p className="text-sm text-green">{estado.mensaje}</p>}
      <button type="submit" disabled={enviando} className={claseBoton()}>
        <Plus size={16} strokeWidth={3} aria-hidden /> {enviando ? "GUARDANDO…" : "CARGAR GASTO"}
      </button>
    </form>
  );
}
