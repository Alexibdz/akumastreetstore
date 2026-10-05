import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, Plus } from "lucide-react";
import { BotonConfirmar } from "@/components/admin/interactivos";
import { Aviso, Encabezado, Tarjeta, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CANALES, MEDIOS_PAGO, nombreDe } from "@/lib/catalogo";
import { obtenerVenta } from "@/lib/db/ventas";
import { fechaHora, porcentaje, precio } from "@/lib/formato";
import { anularVentaAccion } from "../acciones";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/ventas/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Venta #${id}` };
}

export default async function DetalleVenta({ params, searchParams }: PageProps<"/admin/ventas/[id]">) {
  await verificarSesion();
  const { id } = await params;
  const { nueva } = await searchParams;
  const venta = await obtenerVenta(Number(id));
  if (!venta) notFound();

  const costo = venta.items.reduce((s, i) => s + (i.costoUnitario ?? 0) * i.cantidad, 0);
  const sinCosto = venta.items.some((i) => i.costoUnitario === null);
  const ganancia = venta.total - costo;

  return (
    <>
      <Encabezado titulo={`Venta #${venta.id}`} descripcion={fechaHora(venta.fecha)}>
        {!venta.anuladaEn && (
          <BotonConfirmar
            accion={anularVentaAccion.bind(null, venta.id)}
            pregunta={`¿Anular la venta #${venta.id}? El stock vuelve a sumarse y deja de contar en los totales. No se puede deshacer.`}
            className={claseBoton("peligro")}
          >
            <Ban size={16} aria-hidden /> Anular venta
          </BotonConfirmar>
        )}
        <Link href="/admin/ventas/nueva" className={claseBoton()}>
          <Plus size={16} strokeWidth={3} aria-hidden /> Nueva venta
        </Link>
      </Encabezado>

      {nueva === "1" && !venta.anuladaEn && <Aviso>Venta registrada. El stock ya se descontó.</Aviso>}
      {venta.anuladaEn && (
        <Aviso tipo="alerta">Esta venta se anuló el {fechaHora(venta.anuladaEn)}: el stock se devolvió y no suma en los totales.</Aviso>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Tarjeta titulo="Productos" sinRelleno>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="font-mono text-[11px] tracking-[.1em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-normal">Producto</th>
                  <th className="px-5 py-3 text-right font-normal">Cant.</th>
                  <th className="px-5 py-3 text-right font-normal">Precio</th>
                  <th className="px-5 py-3 text-right font-normal">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tabular-nums">
                {venta.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-3">
                      {i.productoId ? (
                        <Link href={`/admin/productos/${i.productoId}`} className="hover:text-green">
                          {i.descripcion}
                        </Link>
                      ) : (
                        i.descripcion
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{i.cantidad}</td>
                    <td className="px-5 py-3 text-right font-mono">{precio(i.precioUnitario)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold">{precio(i.cantidad * i.precioUnitario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Resumen">
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-mono">{precio(venta.subtotal)}</dd>
            </div>
            {venta.descuento > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Descuento</dt>
                <dd className="font-mono">−{precio(venta.descuento)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <dt className="font-bold">Total</dt>
              <dd className={`text-2xl font-bold ${venta.anuladaEn ? "text-muted line-through" : ""}`}>{precio(venta.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Costo de la mercadería</dt>
              <dd className="font-mono">{precio(costo)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ganancia bruta</dt>
              <dd className="font-mono font-bold">
                {precio(ganancia)} {venta.total > 0 && <span className="font-normal text-muted">({porcentaje((ganancia / venta.total) * 100)})</span>}
              </dd>
            </div>
            {sinCosto && <p className="text-xs text-muted">Algún producto no tenía costo cargado: la ganancia real es menor.</p>}
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4">
              <dt className="text-muted">Medio de pago</dt>
              <dd>{nombreDe(MEDIOS_PAGO, venta.medioPago)}</dd>
              <dt className="text-muted">Canal</dt>
              <dd>{nombreDe(CANALES, venta.canal)}</dd>
              <dt className="text-muted">Cliente</dt>
              <dd>{venta.cliente || "—"}</dd>
              {venta.notas && (
                <>
                  <dt className="text-muted">Notas</dt>
                  <dd className="whitespace-pre-line">{venta.notas}</dd>
                </>
              )}
            </div>
          </dl>
        </Tarjeta>
      </div>
    </>
  );
}
