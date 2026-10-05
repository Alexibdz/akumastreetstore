"use client";

import { PackagePlus, SlidersHorizontal } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { ajustarAccion, ingresarAccion } from "@/app/admin/(panel)/stock/acciones";
import { MOTIVOS_AJUSTE } from "@/lib/catalogo";
import { precio } from "@/lib/formato";
import { Dialogo, type EstadoAccion } from "./interactivos";
import { Campo, claseBoton } from "./ui";

type Fila = { varianteId: number; descripcion: string; stock: number; costo: number | null };

function Resultado({ estado }: { estado: EstadoAccion | null }) {
  if (!estado) return null;
  return estado.ok ? null : (
    <p role="alert" className="text-sm text-red">
      {estado.error}
    </p>
  );
}

function FormIngreso({ fila, alTerminar }: { fila: Fila; alTerminar: () => void }) {
  const [estado, accion, enviando] = useActionState(ingresarAccion, null);
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState(fila.costo !== null ? String(fila.costo) : "");
  useEffect(() => {
    if (estado?.ok) alTerminar();
  }, [estado, alTerminar]);
  const total = (Number(cantidad) || 0) * (Number(costo) || 0);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="varianteId" value={fila.varianteId} />
      <p className="text-sm">
        {fila.descripcion} · stock actual <strong className="font-mono">{fila.stock}</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cantidad que entra">
          <input name="cantidad" inputMode="numeric" required autoFocus value={cantidad} onChange={(e) => setCantidad(e.target.value.replace(/\D/g, ""))} className="campo font-mono" />
        </Campo>
        <Campo etiqueta="Costo por unidad $">
          <input name="costo" inputMode="numeric" value={costo} onChange={(e) => setCosto(e.target.value.replace(/\D/g, ""))} placeholder="Opcional" className="campo font-mono" />
        </Campo>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" name="registrarGasto" defaultChecked className="mt-0.5 size-4 accent-[var(--color-green)]" />
        <span>
          Anotar como gasto de mercadería{total > 0 && <strong className="font-mono"> ({precio(total)})</strong>}
          <span className="block text-xs text-muted">Destildalo si ya lo cargaste en Gastos o si no lo pagaste vos.</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" name="actualizarCosto" defaultChecked className="size-4 accent-[var(--color-green)]" />
        Usar este costo como costo del producto
      </label>
      <Campo etiqueta="Nota (opcional)">
        <input name="nota" maxLength={200} placeholder="Proveedor, factura…" className="campo" />
      </Campo>
      <Resultado estado={estado} />
      <button type="submit" disabled={enviando} className={claseBoton()}>
        {enviando ? "GUARDANDO…" : "REGISTRAR INGRESO"}
      </button>
    </form>
  );
}

function FormAjuste({ fila, alTerminar }: { fila: Fila; alTerminar: () => void }) {
  const [estado, accion, enviando] = useActionState(ajustarAccion, null);
  const [real, setReal] = useState(String(Math.max(0, fila.stock)));
  useEffect(() => {
    if (estado?.ok) alTerminar();
  }, [estado, alTerminar]);
  const diferencia = (Number(real) || 0) - fila.stock;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="varianteId" value={fila.varianteId} />
      <p className="text-sm">
        {fila.descripcion} · el sistema dice <strong className="font-mono">{fila.stock}</strong>
      </p>
      <Campo etiqueta="Stock real (lo que contaste)">
        <input name="stockReal" inputMode="numeric" required autoFocus value={real} onChange={(e) => setReal(e.target.value.replace(/\D/g, ""))} className="campo font-mono" />
      </Campo>
      {real !== "" && diferencia !== 0 && (
        <p className="font-mono text-sm">
          {diferencia > 0 ? "+" : "−"}
          {Math.abs(diferencia)} {Math.abs(diferencia) === 1 ? "unidad" : "unidades"}
        </p>
      )}
      <Campo etiqueta="Motivo">
        <select name="motivo" className="campo">
          {MOTIVOS_AJUSTE.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Nota (opcional)">
        <input name="nota" maxLength={200} className="campo" />
      </Campo>
      <Resultado estado={estado} />
      <button type="submit" disabled={enviando || diferencia === 0} className={claseBoton()}>
        {enviando ? "GUARDANDO…" : "AJUSTAR STOCK"}
      </button>
    </form>
  );
}

/** Botones "Ingresar" y "Ajustar" de cada fila de stock. */
export function AccionesStock({ fila }: { fila: Fila }) {
  return (
    <div className="flex justify-end gap-2">
      <Dialogo
        titulo="Ingreso de mercadería"
        claseBoton={claseBoton("secundario", true)}
        boton={
          <>
            <PackagePlus size={14} aria-hidden /> Ingresar
          </>
        }
      >
        {(cerrar) => <FormIngreso fila={fila} alTerminar={cerrar} />}
      </Dialogo>
      <Dialogo
        titulo="Ajustar stock"
        claseBoton={claseBoton("fantasma", true)}
        boton={
          <>
            <SlidersHorizontal size={14} aria-hidden /> Ajustar
          </>
        }
      >
        {(cerrar) => <FormAjuste fila={fila} alTerminar={cerrar} />}
      </Dialogo>
    </div>
  );
}
