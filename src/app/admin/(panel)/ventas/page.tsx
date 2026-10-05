import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Indicador } from "@/components/admin/datos";
import { SelectorMes } from "@/components/admin/interactivos";
import { Encabezado, Vacio, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CANALES, MEDIOS_PAGO, nombreDe } from "@/lib/catalogo";
import { listarVentas } from "@/lib/db/ventas";
import { esMes, fechaHora, mesAR, nombreMes, plural, precio, rangoMes } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ventas" };

export default async function Ventas({ searchParams }: PageProps<"/admin/ventas">) {
  await verificarSesion();
  const sp = await searchParams;
  const mes = esMes(sp.mes) ? sp.mes : mesAR();
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const { desdeISO, hastaISO } = rangoMes(mes);
  const ventas = await listarVentas({ desdeISO, hastaISO, q: q || undefined });

  const validas = ventas.filter((v) => !v.anuladaEn);
  const total = validas.reduce((s, v) => s + v.total, 0);
  const unidades = validas.reduce((s, v) => s + v.items.reduce((u, i) => u + i.cantidad, 0), 0);

  return (
    <>
      <Encabezado titulo="Ventas" descripcion="Todo lo que vendiste: en el local, por WhatsApp o por Instagram.">
        <Link href="/admin/ventas/nueva" className={claseBoton()}>
          <Plus size={16} strokeWidth={3} aria-hidden /> Nueva venta
        </Link>
      </Encabezado>

      <div className="flex flex-wrap items-stretch gap-3">
        <SelectorMes mes={mes} ruta="/admin/ventas" extra={q ? { q } : {}} />
        <form className="flex min-w-60 flex-1" role="search">
          <input type="hidden" name="mes" value={mes} />
          <input name="q" type="search" defaultValue={q} placeholder="Buscar por cliente, producto o nota…" aria-label="Buscar ventas" className="campo" />
          <button type="submit" aria-label="Buscar" className="border-2 border-l-0 border-line-2 px-3 hover:border-bone">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta={`Vendido en ${nombreMes(mes)}`} valor={precio(total)} />
        <Indicador etiqueta="Ventas" valor={String(validas.length)} detalle={plural(unidades, "unidad", "unidades")} />
        <Indicador etiqueta="Ticket promedio" valor={validas.length ? precio(total / validas.length) : "—"} />
        <Indicador etiqueta="Anuladas" valor={String(ventas.length - validas.length)} detalle="No suman en ningún total" />
      </div>

      {ventas.length === 0 ? (
        <Vacio>{q ? "No hay ventas que coincidan con la búsqueda." : `No hay ventas en ${nombreMes(mes)}.`}</Vacio>
      ) : (
        <div className="relative overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-panel font-mono text-[11px] tracking-[.1em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">N°</th>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Productos</th>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Canal · Pago</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ventas.map((v) => (
                <tr key={v.id} className={`hover:bg-panel ${v.anuladaEn ? "text-muted" : ""}`}>
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/admin/ventas/${v.id}`} className="text-green hover:underline">
                      #{v.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{fechaHora(v.fecha)}</td>
                  <td className="max-w-80 px-4 py-3">
                    <Link href={`/admin/ventas/${v.id}`} className={`line-clamp-2 hover:text-green ${v.anuladaEn ? "line-through" : ""}`}>
                      {v.items.map((i) => (i.cantidad > 1 ? `${i.cantidad}× ${i.descripcion}` : i.descripcion)).join(", ")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{v.cliente || <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {nombreDe(CANALES, v.canal)} · {nombreDe(MEDIOS_PAGO, v.medioPago)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                    {v.anuladaEn ? (
                      <span className="text-xs font-bold text-red">ANULADA</span>
                    ) : (
                      precio(v.total)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
