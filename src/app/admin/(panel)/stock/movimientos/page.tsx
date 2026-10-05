import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, Vacio, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { TIPOS_MOVIMIENTO } from "@/lib/catalogo";
import { productoAdmin } from "@/lib/db/productos";
import { movimientos } from "@/lib/db/stock";
import { fechaHora, precio } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Historial de stock" };

export default async function Movimientos({ searchParams }: PageProps<"/admin/stock/movimientos">) {
  await verificarSesion();
  const { producto } = await searchParams;
  const productoId = typeof producto === "string" && /^\d+$/.test(producto) ? Number(producto) : undefined;
  const [lista, p] = await Promise.all([movimientos({ productoId }), productoId ? productoAdmin(productoId) : null]);

  return (
    <>
      <Encabezado titulo="Historial de stock" descripcion={p ? p.nombre : "Los últimos 300 movimientos de todos los productos."}>
        {p && (
          <Link href="/admin/stock/movimientos" className={claseBoton("secundario", true)}>
            Ver todos
          </Link>
        )}
        <Link href="/admin/stock" className={claseBoton("secundario", true)}>
          Volver a Stock
        </Link>
      </Encabezado>

      {lista.length === 0 ? (
        <Vacio>Sin movimientos.</Vacio>
      ) : (
        <div className="relative overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-panel font-mono text-[11px] tracking-[.1em] text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Producto</th>
                <th className="px-4 py-3 font-normal">Movimiento</th>
                <th className="px-4 py-3 text-right font-normal">Cantidad</th>
                <th className="px-4 py-3 text-right font-normal">Quedó</th>
                <th className="px-4 py-3 font-normal">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {lista.map((m) => (
                <tr key={m.id} className="hover:bg-panel">
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{fechaHora(m.fecha)}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/stock/movimientos?producto=${m.productoId}`} className="hover:text-green">
                      {m.producto}
                    </Link>
                    {m.talle && <span className="ml-2 border border-line-2 px-1.5 py-0.5 font-mono text-[11px]">{m.talle}</span>}
                  </td>
                  <td className="px-4 py-2.5">{TIPOS_MOVIMIENTO[m.tipo] ?? m.tipo}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${m.cantidad < 0 ? "text-red" : "text-green"}`}>
                    {m.cantidad > 0 ? `+${m.cantidad}` : `−${Math.abs(m.cantidad)}`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{m.stockResultante}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {m.ventaId && (
                      <Link href={`/admin/ventas/${m.ventaId}`} className="text-green hover:underline">
                        Venta #{m.ventaId}
                      </Link>
                    )}
                    {m.costoUnitario !== null && <span>Costo {precio(m.costoUnitario)} c/u </span>}
                    {m.nota}
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
