"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { registrarVentaAccion } from "@/app/admin/(panel)/ventas/acciones";
import { CANALES, CATEGORIAS, MEDIOS_PAGO, type CategoriaSlug } from "@/lib/catalogo";
import { precio } from "@/lib/formato";
import { normalizar } from "@/lib/texto";
import { Campo, claseBoton } from "./ui";

export type ItemVendible = {
  varianteId: number;
  nombre: string;
  talle: string;
  serie: string;
  categoria: CategoriaSlug;
  precio: number;
  stock: number;
  preventa: boolean;
  imagen: string | null;
};

type Linea = { varianteId: number; cantidad: number; precio: string };

const chip = (activo: boolean) =>
  `cursor-pointer border-2 px-3 py-1.5 text-[13px] font-bold ${activo ? "border-green bg-green text-ink" : "border-line-2 text-bone hover:border-bone"}`;

/** Registrar una venta: buscar productos, armar el ticket, elegir medio de pago y canal. */
export function PuntoDeVenta({ items, hoy }: { items: ItemVendible[]; hoy: string }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<CategoriaSlug | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [descuento, setDescuento] = useState("");
  const [medioPago, setMedioPago] = useState<string>("efectivo");
  const [canal, setCanal] = useState<string>("local");
  const [cliente, setCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [dia, setDia] = useState(hoy);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const porId = useMemo(() => new Map(items.map((i) => [i.varianteId, i])), [items]);
  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    return items.filter(
      (i) => (!categoria || i.categoria === categoria) && (!q || normalizar(`${i.nombre} ${i.talle} ${i.serie}`).includes(q)),
    );
  }, [items, busqueda, categoria]);

  const maximo = (i: ItemVendible) => (i.preventa ? 9999 : Math.max(0, i.stock));
  const enTicket = (id: number) => lineas.find((l) => l.varianteId === id)?.cantidad ?? 0;

  function agregar(i: ItemVendible) {
    setError(null);
    if (enTicket(i.varianteId) >= maximo(i)) return;
    setLineas((ls) =>
      ls.some((l) => l.varianteId === i.varianteId)
        ? ls.map((l) => (l.varianteId === i.varianteId ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...ls, { varianteId: i.varianteId, cantidad: 1, precio: String(i.precio) }],
    );
  }
  const cambiar = (id: number, cambios: Partial<Linea>) => setLineas((ls) => ls.map((l) => (l.varianteId === id ? { ...l, ...cambios } : l)));
  const quitar = (id: number) => setLineas((ls) => ls.filter((l) => l.varianteId !== id));

  const subtotal = lineas.reduce((s, l) => s + l.cantidad * (Number(l.precio) || 0), 0);
  const montoDescuento = Math.min(subtotal, Math.max(0, Math.round(Number(descuento) || 0)));
  const total = subtotal - montoDescuento;

  function registrar() {
    setError(null);
    iniciar(async () => {
      const r = await registrarVentaAccion({
        items: lineas.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad, precioUnitario: Number(l.precio) || 0 })),
        descuento: montoDescuento,
        medioPago,
        canal,
        cliente,
        notas,
        dia,
      });
      if (r && !r.ok) setError(r.error);
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* Productos */}
      <section className="flex min-w-0 flex-col gap-4 border border-line bg-panel p-5">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, talle o serie…"
            aria-label="Buscar producto"
            autoFocus
            className="campo pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(categoria === null)} onClick={() => setCategoria(null)}>
            Todo
          </button>
          {CATEGORIAS.map((c) => (
            <button key={c.slug} type="button" className={chip(categoria === c.slug)} onClick={() => setCategoria(c.slug)}>
              {c.nombre}
            </button>
          ))}
        </div>
        <ul className="flex max-h-[60svh] flex-col divide-y divide-line overflow-y-auto border-t border-line">
          {visibles.length === 0 && <li className="py-8 text-center text-sm text-muted">No hay productos con esa búsqueda.</li>}
          {visibles.map((i) => {
            const agotado = enTicket(i.varianteId) >= maximo(i);
            return (
              <li key={i.varianteId}>
                <button
                  type="button"
                  onClick={() => agregar(i)}
                  disabled={agotado}
                  className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="relative size-11 shrink-0 bg-placeholder">
                    {i.imagen && <Image src={i.imagen} alt="" fill sizes="44px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {i.nombre}
                      {i.talle && <span className="font-normal text-muted"> · {i.talle}</span>}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      {i.preventa ? "PREVENTA" : i.stock > 0 ? `STOCK ${i.stock}` : "SIN STOCK"}
                      {i.serie && ` · ${i.serie.toUpperCase()}`}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-bold">{precio(i.precio)}</span>
                  <Plus size={18} className="shrink-0 text-green" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Ticket */}
      <section className="flex flex-col gap-5 border border-line bg-panel p-5 xl:sticky xl:top-6">
        <h2 className="text-[15px] font-bold">Venta</h2>
        {lineas.length === 0 ? (
          <p className="border border-dashed border-line-2 px-4 py-8 text-center text-sm text-muted">Tocá un producto para agregarlo.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {lineas.map((l) => {
              const i = porId.get(l.varianteId)!;
              return (
                <li key={l.varianteId} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold">
                      {i.nombre}
                      {i.talle && <span className="font-normal text-muted"> · {i.talle}</span>}
                    </span>
                    <button type="button" onClick={() => quitar(l.varianteId)} aria-label={`Quitar ${i.nombre}`} className="cursor-pointer text-muted hover:text-red">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-line-2">
                      <button
                        type="button"
                        aria-label="Uno menos"
                        onClick={() => (l.cantidad > 1 ? cambiar(l.varianteId, { cantidad: l.cantidad - 1 }) : quitar(l.varianteId))}
                        className="cursor-pointer p-2 hover:bg-panel-2"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{l.cantidad}</span>
                      <button
                        type="button"
                        aria-label="Uno más"
                        disabled={l.cantidad >= maximo(i)}
                        onClick={() => cambiar(l.varianteId, { cantidad: l.cantidad + 1 })}
                        className="cursor-pointer p-2 hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-muted">×</span>
                    <input
                      inputMode="numeric"
                      value={l.precio}
                      onChange={(e) => cambiar(l.varianteId, { precio: e.target.value.replace(/\D/g, "") })}
                      aria-label="Precio unitario"
                      className="campo w-28 py-1.5 font-mono"
                    />
                    <span className="ml-auto font-mono text-sm font-bold">{precio(l.cantidad * (Number(l.precio) || 0))}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-mono">{precio(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">
              <label htmlFor="descuento">Descuento $</label>
            </dt>
            <dd>
              <input
                id="descuento"
                inputMode="numeric"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className="campo w-28 py-1.5 text-right font-mono"
              />
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <dt className="font-bold">Total</dt>
            <dd className="text-3xl font-bold">{precio(total)}</dd>
          </div>
        </dl>

        <Campo etiqueta="Medio de pago">
          <div className="flex flex-wrap gap-2">
            {MEDIOS_PAGO.map((m) => (
              <button key={m.id} type="button" className={chip(medioPago === m.id)} onClick={() => setMedioPago(m.id)}>
                {m.nombre}
              </button>
            ))}
          </div>
        </Campo>
        <Campo etiqueta="Canal">
          <div className="flex flex-wrap gap-2">
            {CANALES.map((c) => (
              <button key={c.id} type="button" className={chip(canal === c.id)} onClick={() => setCanal(c.id)}>
                {c.nombre}
              </button>
            ))}
          </div>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Cliente (opcional)">
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={80} className="campo" />
          </Campo>
          <Campo etiqueta="Fecha">
            <input type="date" value={dia} max={hoy} onChange={(e) => setDia(e.target.value)} className="campo" />
          </Campo>
        </div>
        <Campo etiqueta="Notas (opcional)">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} maxLength={500} className="campo resize-y" />
        </Campo>

        {error && (
          <p role="alert" className="border-l-4 border-red bg-red/10 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <button type="button" onClick={registrar} disabled={enviando || lineas.length === 0} className={`${claseBoton()} py-4 text-base`}>
          {enviando ? "REGISTRANDO…" : `REGISTRAR VENTA · ${precio(total)}`}
        </button>
      </section>
    </div>
  );
}
