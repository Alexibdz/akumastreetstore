import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, History } from "lucide-react";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { Encabezado, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { productoAdmin, seriesExistentes } from "@/lib/db/productos";
import { eliminarProductoAccion } from "../acciones";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/productos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await productoAdmin(Number(id));
  return { title: p ? p.nombre : "Producto" };
}

export default async function EditarProducto({ params }: PageProps<"/admin/productos/[id]">) {
  await verificarSesion();
  const { id } = await params;
  const [p, series] = await Promise.all([productoAdmin(Number(id)), seriesExistentes()]);
  if (!p) notFound();

  return (
    <>
      <Encabezado titulo={p.nombre} descripcion={p.visible ? "Visible en la web" : "Oculto: no aparece en la web"}>
        <Link href={`/admin/stock/movimientos?producto=${p.id}`} className={claseBoton("secundario", true)}>
          <History size={14} aria-hidden /> Historial de stock
        </Link>
        {p.visible && (
          <Link href={`/producto/${p.slug}`} target="_blank" className={claseBoton("secundario", true)}>
            <ExternalLink size={14} aria-hidden /> Ver en la tienda
          </Link>
        )}
      </Encabezado>
      <FormularioProducto
        id={p.id}
        series={series}
        variantesActuales={p.variantes}
        eliminar={eliminarProductoAccion.bind(null, p.id)}
        inicial={{
          nombre: p.nombre,
          slug: p.slug,
          categoria: p.categoria,
          serie: p.serie,
          descripcion: p.descripcion,
          precio: String(p.precio),
          precioAnterior: p.precioAnterior !== null ? String(p.precioAnterior) : "",
          costo: p.costo !== null ? String(p.costo) : "",
          etiqueta: p.etiqueta ?? "",
          destacado: p.destacado,
          visible: p.visible,
          imagenes: p.imagenes,
        }}
      />
    </>
  );
}
