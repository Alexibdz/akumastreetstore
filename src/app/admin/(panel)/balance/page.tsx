import type { Metadata } from "next";
import Link from "next/link";
import { Barra, COLOR_EGRESOS, COLOR_INGRESOS, GraficoColumnas, Indicador } from "@/components/admin/datos";
import { SelectorMes } from "@/components/admin/interactivos";
import { Aviso, Encabezado, Tarjeta, Vacio } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CANALES, CATEGORIAS, CATEGORIAS_GASTO, MEDIOS_PAGO, nombreDe } from "@/lib/catalogo";
import { ingresosYEgresos, resumenMes } from "@/lib/db/balance";
import { compacto, esMes, mesAR, mesCorto, nombreMes, plural, porcentaje, precio, sumarMeses } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Balance" };

/** Tabla de desglose: nombre, barrita proporcional, monto y porcentaje del total. */
function Desglose({
  filas,
  color,
  vacio,
}: {
  filas: { nombre: string; total: number; detalle?: string }[];
  color: string;
  vacio: string;
}) {
  const suma = filas.reduce((s, f) => s + f.total, 0);
  const maximo = Math.max(0, ...filas.map((f) => f.total));
  if (filas.length === 0) return <Vacio>{vacio}</Vacio>;
  return (
    <ul className="flex flex-col gap-3.5 text-sm">
      {filas.map((f) => (
        <li key={f.nombre} className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <span>
              {f.nombre}
              {f.detalle && <span className="ml-2 text-xs text-muted">{f.detalle}</span>}
            </span>
            <span className="font-mono tabular-nums">
              {precio(f.total)} <span className="text-xs text-muted">{suma > 0 ? porcentaje((f.total / suma) * 100) : ""}</span>
            </span>
          </span>
          <Barra valor={f.total} maximo={maximo} color={color} />
        </li>
      ))}
    </ul>
  );
}

export default async function Balance({ searchParams }: PageProps<"/admin/balance">) {
  await verificarSesion();
  const sp = await searchParams;
  const mes = esMes(sp.mes) ? sp.mes : mesAR();
  const meses = Array.from({ length: 6 }, (_, i) => sumarMeses(mes, i - 5));
  const [r, historia] = await Promise.all([resumenMes(mes), ingresosYEgresos(meses)]);

  const margen = r.ventas.total > 0 ? (r.gananciaBruta / r.ventas.total) * 100 : 0;
  const columnas = historia.map((h) => ({
    etiqueta: `${mesCorto(h.mes)} ${h.mes.slice(2, 4)}`,
    titulo: nombreMes(h.mes),
    valores: [h.ingresos, h.egresos],
  }));

  return (
    <>
      <Encabezado titulo="Balance" descripcion="Lo que entró por ventas menos lo que salió en gastos. Las ventas anuladas no cuentan." />
      <SelectorMes mes={mes} ruta="/admin/balance" />

      {r.unidadesSinCosto > 0 && (
        <Aviso tipo="alerta">
          {r.unidadesSinCosto} {r.unidadesSinCosto === 1 ? "unidad vendida no tenía" : "unidades vendidas no tenían"} costo cargado, así que la ganancia bruta
          aparece más alta de lo que es.{" "}
          <Link href="/admin/productos" className="font-bold text-green underline">
            Cargar costos
          </Link>
        </Aviso>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <Indicador
            grande
            etiqueta={`Balance de ${nombreMes(mes)}`}
            valor={precio(r.balance)}
            detalle={r.balance < 0 ? "Salió más plata de la que entró." : "Ingresos menos egresos."}
          />
        </div>
        <Indicador etiqueta="Ingresos por ventas" valor={precio(r.ventas.total)} detalle={`${plural(r.ventas.cantidad, "venta", "ventas")} · ${plural(r.unidades, "unidad", "unidades")}`} />
        <Indicador etiqueta="Egresos (gastos)" valor={precio(r.gastos)} detalle={plural(r.gastosPorCategoria.reduce((s, g) => s + g.cantidad, 0), "gasto cargado", "gastos cargados")} />
        <Indicador
          etiqueta="Ganancia bruta"
          valor={precio(r.gananciaBruta)}
          detalle={`${porcentaje(margen)} de margen sobre lo vendido, antes de gastos fijos`}
        />
        <Indicador etiqueta="Ticket promedio" valor={r.ventas.cantidad ? precio(r.ventas.total / r.ventas.cantidad) : "—"} />
        <Indicador etiqueta="Costo de lo vendido" valor={precio(r.costoVendido)} detalle="Lo que te costó la mercadería que vendiste" />
        <Indicador etiqueta="Descuentos hechos" valor={precio(r.ventas.descuentos)} />
      </div>

      <Tarjeta titulo="Ingresos y egresos · últimos 6 meses">
        <GraficoColumnas
          titulo="Mes"
          series={[
            { nombre: "Ingresos", color: COLOR_INGRESOS },
            { nombre: "Egresos", color: COLOR_EGRESOS },
          ]}
          columnas={columnas}
          formato={precio}
          formatoEje={compacto}
          alto={220}
        />
      </Tarjeta>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Ventas por medio de pago">
          <Desglose
            color={COLOR_INGRESOS}
            vacio="Sin ventas en el mes."
            filas={r.porMedio.map((m) => ({ nombre: nombreDe(MEDIOS_PAGO, m.id), total: m.total, detalle: plural(m.cantidad, "venta", "ventas") }))}
          />
        </Tarjeta>
        <Tarjeta titulo="Ventas por canal">
          <Desglose
            color={COLOR_INGRESOS}
            vacio="Sin ventas en el mes."
            filas={r.porCanal.map((c) => ({ nombre: nombreDe(CANALES, c.id), total: c.total, detalle: plural(c.cantidad, "venta", "ventas") }))}
          />
        </Tarjeta>
        <Tarjeta titulo="Ventas por categoría (precio de lista)">
          <Desglose
            color={COLOR_INGRESOS}
            vacio="Sin ventas en el mes."
            filas={r.porCategoria.map((c) => ({
              nombre: CATEGORIAS.find((x) => x.slug === c.id)?.nombre ?? "Productos borrados",
              total: c.total,
              detalle: `${c.unidades} u.`,
            }))}
          />
        </Tarjeta>
        <Tarjeta titulo="Gastos por categoría">
          <Desglose
            color={COLOR_EGRESOS}
            vacio="Sin gastos en el mes."
            filas={r.gastosPorCategoria.map((g) => ({ nombre: nombreDe(CATEGORIAS_GASTO, g.id), total: g.total }))}
          />
        </Tarjeta>
      </div>
    </>
  );
}
