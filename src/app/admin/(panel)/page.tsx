import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { COLOR_INGRESOS, GraficoColumnas, Indicador, variacion } from "@/components/admin/datos";
import { Aviso, Encabezado, Tarjeta, Vacio, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { masVendidos, resumenMes, totalVentas, ventasPorDia } from "@/lib/db/balance";
import { WHATSAPP_DE_EJEMPLO, obtenerConfiguracion } from "@/lib/db/configuracion";
import { stockBajo } from "@/lib/db/stock";
import { listarVentas } from "@/lib/db/ventas";
import { ZONA, compacto, diaAR, fechaHora, inicioDiaISO, mesAR, nombreMes, plural, precio, rangoMes, sumarDias, sumarMeses } from "@/lib/formato";

export const dynamic = "force-dynamic";

/** Mismo tramo del mes anterior (del 1 al día de hoy) para comparar parejo. */
function hastaMismoDiaMesAnterior(hoy: string) {
  const anterior = sumarMeses(hoy.slice(0, 7), -1);
  const diasDelMes = new Date(Date.UTC(Number(anterior.slice(0, 4)), Number(anterior.slice(5, 7)), 0)).getUTCDate();
  const dia = Math.min(Number(hoy.slice(8, 10)), diasDelMes);
  return { desde: rangoMes(anterior).desdeISO, hasta: inicioDiaISO(sumarDias(`${anterior}-${String(dia).padStart(2, "0")}`, 1)) };
}

export default async function Inicio() {
  await verificarSesion();
  const hoy = diaAR();
  const mes = mesAR();
  const comparacion = hastaMismoDiaMesAnterior(hoy);
  const config = await obtenerConfiguracion();
  const [deHoy, resumen, anterior, porDia, bajo, recientes, top] = await Promise.all([
    totalVentas(inicioDiaISO(hoy), inicioDiaISO(sumarDias(hoy, 1))),
    resumenMes(mes),
    totalVentas(comparacion.desde, comparacion.hasta),
    ventasPorDia(sumarDias(hoy, -29), sumarDias(hoy, 1)),
    stockBajo(config.umbralStockBajo),
    listarVentas({ limite: 6 }),
    masVendidos(rangoMes(mes).desdeISO, rangoMes(mes).hastaISO, 5),
  ]);

  const fechaLarga = new Date().toLocaleDateString("es-AR", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" });
  const columnas = porDia.map((d) => {
    const fecha = new Date(`${d.dia}T12:00:00-03:00`);
    return {
      etiqueta: `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`,
      titulo: `${fecha.toLocaleDateString("es-AR", { timeZone: ZONA, weekday: "short" })} ${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)} · ${plural(d.cantidad, "venta", "ventas")}`,
      valores: [d.total],
    };
  });

  return (
    <>
      <Encabezado titulo="Inicio" descripcion={fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)}>
        <Link href="/admin/gastos" className={claseBoton("secundario")}>
          <Wallet size={16} aria-hidden /> Cargar gasto
        </Link>
        <Link href="/admin/ventas/nueva" className={claseBoton()}>
          <Plus size={16} strokeWidth={3} aria-hidden /> Nueva venta
        </Link>
      </Encabezado>

      {config.whatsapp === WHATSAPP_DE_EJEMPLO && (
        <Aviso tipo="alerta">
          Todavía no cargaste el número de WhatsApp de la tienda: los botones CONSULTAR no le llegan a nadie.{" "}
          <Link href="/admin/configuracion" className="font-bold text-green underline">
            Cargarlo en Configuración
          </Link>
        </Aviso>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <Indicador
            grande
            etiqueta={`Vendido en ${nombreMes(mes)}`}
            valor={precio(resumen.ventas.total)}
            delta={variacion(resumen.ventas.total, anterior.total, true, "mismo período del mes anterior")}
            detalle={`${plural(resumen.ventas.cantidad, "venta", "ventas")} · ${plural(resumen.unidades, "unidad", "unidades")}`}
          />
        </div>
        <Indicador etiqueta="Vendido hoy" valor={precio(deHoy.total)} detalle={plural(deHoy.cantidad, "venta", "ventas")} />
        <Indicador
          etiqueta="Balance del mes"
          valor={precio(resumen.balance)}
          detalle={
            <>
              Ventas menos gastos ({precio(resumen.gastos)}).{" "}
              <Link href="/admin/balance" className="text-green hover:underline">
                Ver balance
              </Link>
            </>
          }
        />
      </div>

      <Tarjeta titulo="Ventas por día · últimos 30 días">
        <GraficoColumnas
          titulo="Ventas por día"
          series={[{ nombre: "Ventas", color: COLOR_INGRESOS }]}
          columnas={columnas}
          formato={precio}
          formatoEje={compacto}
          etiquetaCada={5}
          rotularMaximo
        />
      </Tarjeta>

      <div className="grid gap-4 xl:grid-cols-3">
        <Tarjeta
          titulo={`Stock bajo (${config.umbralStockBajo} o menos)`}
          accion={
            <Link href="/admin/stock?bajo=1" className="text-xs text-green hover:underline">
              Ver todo
            </Link>
          }
          sinRelleno
        >
          {bajo.length === 0 ? (
            <div className="p-5">
              <Vacio>Todo con stock suficiente.</Vacio>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {bajo.slice(0, 8).map((f) => (
                <li key={f.varianteId} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <Link href={`/admin/stock?q=${encodeURIComponent(f.producto)}`} className="min-w-0 truncate hover:text-green">
                    {f.producto}
                    {f.talle && <span className="text-muted"> · {f.talle}</span>}
                  </Link>
                  <span className={`shrink-0 font-mono text-xs font-bold ${f.stock <= 0 ? "text-red" : "text-bone"}`}>
                    {f.stock <= 0 ? "SIN STOCK" : `${f.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Últimas ventas"
          accion={
            <Link href="/admin/ventas" className="text-xs text-green hover:underline">
              Ver todas
            </Link>
          }
          sinRelleno
        >
          {recientes.length === 0 ? (
            <div className="p-5">
              <Vacio>Todavía no hay ventas.</Vacio>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recientes.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/ventas/${v.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-panel-2">
                    <span className="min-w-0">
                      <span className={`block truncate ${v.anuladaEn ? "text-muted line-through" : ""}`}>
                        {v.items.map((i) => i.descripcion).join(", ")}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        #{v.id} · {fechaHora(v.fecha)}
                        {v.cliente && ` · ${v.cliente}`}
                      </span>
                    </span>
                    <span className={`shrink-0 font-mono text-sm font-bold ${v.anuladaEn ? "text-muted line-through" : ""}`}>{precio(v.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo={`Más vendidos de ${nombreMes(mes)}`} sinRelleno>
          {top.length === 0 ? (
            <div className="p-5">
              <Vacio>Sin ventas este mes.</Vacio>
            </div>
          ) : (
            <ol className="divide-y divide-line">
              {top.map((p, i) => (
                <li key={`${p.productoId}-${p.nombre}`} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-5 shrink-0 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{p.unidades} u.</span>
                  <span className="w-24 shrink-0 text-right font-mono text-sm font-bold tabular-nums">{precio(p.total)}</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
