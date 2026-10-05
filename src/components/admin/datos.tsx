import { ArrowDownRight, ArrowUpRight } from "lucide-react";

// Indicadores y gráficos del panel.
// Colores de datos validados para daltonismo sobre el fondo oscuro (verde un escalón más oscuro que el de la marca).
export const COLOR_INGRESOS = "#36aa7b";
export const COLOR_EGRESOS = "#e0402f";

type Delta = { texto: string; sube: boolean; bueno: boolean };

/** Número grande con su etiqueta. La variación lleva flecha y signo, no solo color. */
export function Indicador({
  etiqueta,
  valor,
  detalle,
  delta,
  grande = false,
}: {
  etiqueta: string;
  valor: string;
  detalle?: React.ReactNode;
  delta?: Delta | null;
  grande?: boolean;
}) {
  const Flecha = delta?.sube ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex min-w-0 flex-col gap-2 border border-line bg-panel p-5">
      <span className="text-sm text-muted">{etiqueta}</span>
      <span className={`leading-none font-bold tracking-tight ${grande ? "text-[clamp(40px,5vw,52px)]" : "text-[28px]"}`}>{valor}</span>
      {delta && (
        <span className={`flex items-center gap-1 text-xs font-bold ${delta.bueno ? "text-green" : "text-red"}`}>
          <Flecha size={14} strokeWidth={2.5} aria-hidden />
          {delta.texto}
        </span>
      )}
      {detalle && <span className="text-xs text-muted">{detalle}</span>}
    </div>
  );
}

/** Variación porcentual contra un período anterior; null si no hay con qué comparar. */
export function variacion(actual: number, anterior: number, subirEsBueno = true, contra = "mes anterior"): Delta | null {
  if (anterior <= 0) return null;
  const cambio = ((actual - anterior) / anterior) * 100;
  const sube = cambio >= 0;
  return {
    texto: `${sube ? "+" : "−"}${Math.abs(Math.round(cambio))}% vs. ${contra}`,
    sube,
    bueno: sube === subirEsBueno,
  };
}

/** Barrita horizontal de proporción para tablas (una sola serie). */
export function Barra({ valor, maximo, color = COLOR_INGRESOS }: { valor: number; maximo: number; color?: string }) {
  const ancho = maximo > 0 ? Math.max(1, (valor / maximo) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-line" aria-hidden>
      <div className="h-full" style={{ width: `${ancho}%`, background: color }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gráfico de columnas
// ---------------------------------------------------------------------------

type Serie = { nombre: string; color: string };
type Columna = { etiqueta: string; titulo: string; valores: number[] };

/** Escala con números redondos: 0, 250k, 500k... (como mucho 4 tramos). */
function escala(maximo: number) {
  if (maximo <= 0) return { tope: 1, marcas: [0] };
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 2.5, 5, 10].map((p) => p * potencia).find((p) => maximo / p <= 4)!;
  const tope = Math.ceil(maximo / paso) * paso;
  const marcas: number[] = [];
  for (let v = 0; v <= tope + paso / 2; v += paso) marcas.push(v);
  return { tope, marcas };
}

/**
 * Columnas agrupadas en HTML/CSS. Una sola escala (nunca dos ejes), barras de hasta 24 px con 2 px de aire,
 * tooltip al pasar el mouse o con el teclado, leyenda si hay más de una serie, y la tabla con los mismos datos.
 */
export function GraficoColumnas({
  titulo,
  series,
  columnas,
  formato,
  formatoEje,
  alto = 200,
  etiquetaCada = 1,
  rotularMaximo = false,
}: {
  titulo: string;
  series: Serie[];
  columnas: Columna[];
  formato: (n: number) => string;
  formatoEje: (n: number) => string;
  alto?: number;
  etiquetaCada?: number;
  rotularMaximo?: boolean;
}) {
  const maximo = Math.max(0, ...columnas.flatMap((c) => c.valores));
  const { tope, marcas } = escala(maximo);
  const indiceMaximo = rotularMaximo && maximo > 0 ? columnas.findIndex((c) => c.valores[0] === maximo) : -1;

  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="sr-only">{titulo}</figcaption>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          {series.map((s) => (
            <li key={s.nombre} className="flex items-center gap-2">
              <span className="size-2.5" style={{ background: s.color }} aria-hidden />
              {s.nombre}
            </li>
          ))}
        </ul>
      )}

      <div className="flex" style={{ height: alto }}>
        {/* Eje Y */}
        <div className="relative w-14 shrink-0" aria-hidden>
          {marcas.map((m) => (
            <span
              key={m}
              className="absolute right-2 translate-y-1/2 font-mono text-[11px] text-muted tabular-nums"
              style={{ bottom: `${(m / tope) * 100}%` }}
            >
              {formatoEje(m)}
            </span>
          ))}
        </div>
        {/* Área del gráfico */}
        <div className="relative flex-1">
          {marcas.map((m) => (
            <div key={m} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${(m / tope) * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end">
            {columnas.map((c, i) => {
              // Primer tercio: el tooltip se abre hacia la derecha; último tercio: hacia la izquierda (no se sale del gráfico)
              const lado = i < columnas.length / 3 ? "left-0" : i >= (columnas.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              const resumen = `${c.titulo}: ${series.map((s, j) => `${s.nombre} ${formato(c.valores[j])}`).join(", ")}`;
              return (
                <div
                  key={c.titulo}
                  tabIndex={0}
                  aria-label={resumen}
                  className="group relative flex h-full flex-1 items-end justify-center gap-0.5 px-px outline-none"
                >
                  {c.valores.map((v, j) => (
                    <div
                      key={series[j].nombre}
                      className="relative w-full max-w-6 transition-[filter] group-hover:brightness-125 group-focus-visible:brightness-125"
                      style={{ height: v > 0 ? `max(${(v / tope) * 100}%, 2px)` : 0, background: series[j].color }}
                    >
                      {i === indiceMaximo && j === 0 && (
                        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-bone">
                          {formatoEje(v)}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Tooltip: el valor primero, la serie después */}
                  <div
                    className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden min-w-36 flex-col gap-1.5 border border-line-2 bg-ink px-3 py-2.5 whitespace-nowrap group-hover:flex group-focus-visible:flex ${lado}`}
                    aria-hidden
                  >
                    <span className="font-mono text-[11px] text-muted">{c.titulo}</span>
                    {series.map((s, j) => (
                      <span key={s.nombre} className="flex items-center gap-2 text-sm">
                        <span className="h-0.5 w-3" style={{ background: s.color }} />
                        <strong className="font-bold text-bone">{formato(c.valores[j])}</strong>
                        <span className="text-xs text-muted">{s.nombre}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Eje X */}
      <div className="-mt-2 flex pl-14" aria-hidden>
        {columnas.map((c, i) => (
          <span key={c.titulo} className="flex-1 overflow-visible text-center font-mono text-[10px] whitespace-nowrap text-muted">
            {i % etiquetaCada === 0 ? c.etiqueta : ""}
          </span>
        ))}
      </div>

      <details className="text-sm">
        <summary className="w-fit cursor-pointer font-mono text-[11px] tracking-[.12em] text-muted hover:text-bone">VER COMO TABLA</summary>
        <div className="mt-3 max-h-72 overflow-auto">
          <table className="w-full text-left">
            <thead className="font-mono text-[11px] tracking-[.08em] text-muted">
              <tr>
                <th className="py-1.5 pr-4 font-normal">{titulo}</th>
                {series.map((s) => (
                  <th key={s.nombre} className="py-1.5 pr-4 text-right font-normal">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {columnas.map((c) => (
                <tr key={c.titulo} className="border-t border-line">
                  <td className="py-1.5 pr-4">{c.titulo}</td>
                  {c.valores.map((v, j) => (
                    <td key={j} className="py-1.5 pr-4 text-right">
                      {formato(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
