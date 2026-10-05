"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { guardarProductoAccion, type FormularioProducto as Datos } from "@/app/admin/(panel)/productos/acciones";
import { CATEGORIAS, ETIQUETAS } from "@/lib/catalogo";
import { descuento, porcentaje, precio } from "@/lib/formato";
import { slugify } from "@/lib/texto";
import { BotonConfirmar, type ResultadoAccion } from "./interactivos";
import { SubirImagenes } from "./SubirImagenes";
import { Campo, Tarjeta, claseBoton } from "./ui";

type VarianteActual = { id: number; nombre: string; stock: number };
type Talle = { id?: number; nombre: string; stockInicial: string };

const PRESETS = [
  ["S", "M", "L", "XL"],
  ["XS", "S", "M", "L", "XL", "XXL"],
];

export function FormularioProducto({
  id,
  inicial,
  variantesActuales = [],
  series,
  eliminar,
}: {
  id: number | null;
  inicial: Omit<Datos, "variantes">;
  variantesActuales?: VarianteActual[];
  series: string[];
  eliminar?: () => Promise<ResultadoAccion>;
}) {
  const creando = id === null;
  const [f, setF] = useState(inicial);
  const cambiar = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const unica = variantesActuales.find((v) => v.nombre === "");
  const [conTalles, setConTalles] = useState(variantesActuales.some((v) => v.nombre !== ""));
  const [talles, setTalles] = useState<Talle[]>(
    variantesActuales.filter((v) => v.nombre !== "").map((v) => ({ id: v.id, nombre: v.nombre, stockInicial: "" })),
  );
  const [stockUnico, setStockUnico] = useState("");
  const stockDe = (idVariante?: number) => variantesActuales.find((v) => v.id === idVariante)?.stock ?? 0;

  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  // Pasar de "sin talles" a "con talles" (o al revés) solo si el stock que se deja de usar está en 0
  const stockSinTalle = unica?.stock ?? 0;
  const stockEnTalles = talles.reduce((s, t) => s + stockDe(t.id), 0);
  const puedeCambiarModo = creando || (conTalles ? stockEnTalles === 0 : stockSinTalle === 0);

  const nPrecio = Number(f.precio) || 0;
  const nCosto = Number(f.costo) || 0;
  const nAnterior = Number(f.precioAnterior) || 0;

  function agregarTalles(nombres: string[]) {
    setTalles((ts) => [...ts, ...nombres.filter((n) => !ts.some((t) => t.nombre.toUpperCase() === n.toUpperCase())).map((n) => ({ nombre: n, stockInicial: "" }))]);
  }

  function guardar() {
    setError(null);
    const variantes = conTalles
      ? talles.map((t) => ({ id: t.id, nombre: t.nombre, stockInicial: t.stockInicial }))
      : [{ id: unica?.id, nombre: "", stockInicial: stockUnico }];
    if (conTalles && variantes.length === 0) {
      setError("Agregá al menos un talle o desactivá «Tiene talles».");
      return;
    }
    iniciar(async () => {
      const r = await guardarProductoAccion(id, { ...f, variantes });
      if (r && !r.ok) setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta titulo="Datos">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre" className="sm:col-span-2">
                <input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={120} required className="campo" />
              </Campo>
              <Campo etiqueta="Categoría">
                <select value={f.categoria} onChange={(e) => cambiar("categoria", e.target.value)} className="campo">
                  {CATEGORIAS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Serie" ayuda="Anime, saga o línea. Agrupa los productos en «Buscar por serie».">
                <input value={f.serie} onChange={(e) => cambiar("serie", e.target.value)} list="series" maxLength={60} className="campo" />
                <datalist id="series">
                  {series.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Campo>
              <Campo etiqueta="Descripción" className="sm:col-span-2">
                <textarea value={f.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} rows={4} maxLength={3000} className="campo resize-y" />
              </Campo>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Fotos">
            <SubirImagenes imagenes={f.imagenes} onChange={(urls) => cambiar("imagenes", urls)} />
          </Tarjeta>

          <Tarjeta titulo="Talles y stock">
            <div className="flex flex-col gap-4">
              <label className={`flex items-center gap-2.5 text-sm ${puedeCambiarModo ? "cursor-pointer" : "opacity-60"}`}>
                <input
                  type="checkbox"
                  checked={conTalles}
                  disabled={!puedeCambiarModo}
                  onChange={(e) => setConTalles(e.target.checked)}
                  className="size-4 accent-[var(--color-green)]"
                />
                Tiene talles (ropa)
              </label>
              {!puedeCambiarModo && (
                <p className="text-xs text-muted">
                  Para cambiar esto, primero dejá el stock en 0 desde{" "}
                  <Link href={`/admin/stock?q=${encodeURIComponent(inicial.nombre)}`} className="text-green underline">
                    Stock
                  </Link>
                  .
                </p>
              )}

              {!conTalles &&
                (creando ? (
                  <Campo etiqueta="Stock inicial" ayuda="Cuántas unidades tenés ahora.">
                    <input inputMode="numeric" value={stockUnico} onChange={(e) => setStockUnico(e.target.value.replace(/\D/g, ""))} placeholder="0" className="campo w-36" />
                  </Campo>
                ) : (
                  <p className="text-sm">
                    Stock actual: <strong className="font-mono">{stockSinTalle}</strong>{" "}
                    <Link href={`/admin/stock?q=${encodeURIComponent(inicial.nombre)}`} className="text-green hover:underline">
                      Ingresar o ajustar →
                    </Link>
                  </p>
                ))}

              {conTalles && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button key={p.join()} type="button" onClick={() => agregarTalles(p)} className={claseBoton("secundario", true)}>
                        + {p.join(" · ")}
                      </button>
                    ))}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {talles.map((t, i) => {
                      const stock = stockDe(t.id);
                      return (
                        <li key={t.id ?? `nuevo-${i}`} className="flex items-center gap-2">
                          <input
                            value={t.nombre}
                            onChange={(e) => setTalles((ts) => ts.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
                            maxLength={20}
                            placeholder="Talle"
                            aria-label="Nombre del talle"
                            className="campo w-28"
                          />
                          {creando ? (
                            <input
                              inputMode="numeric"
                              value={t.stockInicial}
                              onChange={(e) => setTalles((ts) => ts.map((x, j) => (j === i ? { ...x, stockInicial: e.target.value.replace(/\D/g, "") } : x)))}
                              placeholder="Stock"
                              aria-label={`Stock inicial del talle ${t.nombre}`}
                              className="campo w-24"
                            />
                          ) : (
                            <span className="w-24 font-mono text-sm text-muted">{t.id ? `stock ${stock}` : "nuevo · 0"}</span>
                          )}
                          <button
                            type="button"
                            disabled={stock !== 0}
                            title={stock !== 0 ? "Tiene stock: primero dejalo en 0 desde Stock" : "Quitar talle"}
                            aria-label="Quitar talle"
                            onClick={() => setTalles((ts) => ts.filter((_, j) => j !== i))}
                            className="cursor-pointer p-2 text-muted hover:text-red disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onClick={() => setTalles((ts) => [...ts, { nombre: "", stockInicial: "" }])} className={`${claseBoton("fantasma", true)} w-fit px-0`}>
                    <Plus size={14} aria-hidden /> Agregar talle
                  </button>
                  {!creando && (
                    <p className="text-xs text-muted">
                      Los talles nuevos arrancan en 0. El stock se carga desde{" "}
                      <Link href={`/admin/stock?q=${encodeURIComponent(inicial.nombre)}`} className="text-green underline">
                        Stock
                      </Link>{" "}
                      para que quede el historial.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-5">
          <Tarjeta titulo="Precio">
            <div className="flex flex-col gap-4">
              <Campo etiqueta="Precio de venta $">
                <input inputMode="numeric" value={f.precio} onChange={(e) => cambiar("precio", e.target.value.replace(/\D/g, ""))} required className="campo font-mono" />
              </Campo>
              <Campo etiqueta="Precio anterior $ (oferta)" ayuda="Si lo completás, se muestra tachado y el producto entra en Ofertas.">
                <input
                  inputMode="numeric"
                  value={f.precioAnterior}
                  onChange={(e) => cambiar("precioAnterior", e.target.value.replace(/\D/g, ""))}
                  placeholder="Sin oferta"
                  className="campo font-mono"
                />
              </Campo>
              {nAnterior > nPrecio && nPrecio > 0 && (
                <p className="text-sm">
                  Se muestra como <span className="bg-red px-1.5 py-0.5 text-xs font-black text-white">{descuento(nPrecio, nAnterior)}</span>{" "}
                  <span className="font-mono text-muted line-through">{precio(nAnterior)}</span>
                </p>
              )}
              <Campo etiqueta="Costo $ (no se muestra en la tienda)" ayuda="Lo que te cuesta cada unidad. Sirve para calcular la ganancia.">
                <input inputMode="numeric" value={f.costo} onChange={(e) => cambiar("costo", e.target.value.replace(/\D/g, ""))} placeholder="Sin cargar" className="campo font-mono" />
              </Campo>
              {nCosto > 0 && nPrecio > 0 && (
                <p className="text-sm text-muted">
                  Ganancia por unidad: <strong className="font-mono text-bone">{precio(nPrecio - nCosto)}</strong> ({porcentaje(((nPrecio - nCosto) / nPrecio) * 100)} del precio)
                </p>
              )}
            </div>
          </Tarjeta>

          <Tarjeta titulo="En la tienda">
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={f.visible} onChange={(e) => cambiar("visible", e.target.checked)} className="size-4 accent-[var(--color-green)]" />
                Visible en la web
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={f.destacado} onChange={(e) => cambiar("destacado", e.target.checked)} className="size-4 accent-[var(--color-green)]" />
                Destacado (aparece primero)
              </label>
              <Campo etiqueta="Etiqueta">
                <select value={f.etiqueta} onChange={(e) => cambiar("etiqueta", e.target.value)} className="campo">
                  <option value="">Ninguna</option>
                  {ETIQUETAS.map((e) => (
                    <option key={e} value={e}>
                      {e === "PREVENTA" ? "PREVENTA (se puede vender sin stock)" : e}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Dirección (URL)" ayuda={`/producto/${slugify(f.slug || f.nombre) || "…"}`}>
                <input value={f.slug} onChange={(e) => cambiar("slug", e.target.value)} placeholder="Se arma sola con el nombre" maxLength={80} className="campo font-mono text-xs" />
              </Campo>
            </div>
          </Tarjeta>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-line bg-ink py-4">
        <button type="button" onClick={guardar} disabled={guardando} className={claseBoton()}>
          {guardando ? "GUARDANDO…" : creando ? "CREAR PRODUCTO" : "GUARDAR CAMBIOS"}
        </button>
        <Link href="/admin/productos" className={claseBoton("fantasma")}>
          Cancelar
        </Link>
        {error && (
          <p role="alert" className="text-sm text-red">
            {error}
          </p>
        )}
        {eliminar && (
          <span className="ml-auto">
            <BotonConfirmar
              accion={eliminar}
              pregunta={`¿Borrar «${inicial.nombre}»? Se borra también su historial de stock. Si tiene ventas, no se puede: ocultalo.`}
              className={claseBoton("peligro", true)}
            >
              <Trash2 size={14} aria-hidden /> Borrar producto
            </BotonConfirmar>
          </span>
        )}
      </div>
    </div>
  );
}
