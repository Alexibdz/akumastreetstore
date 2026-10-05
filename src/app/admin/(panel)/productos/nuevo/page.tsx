import type { Metadata } from "next";
import { FormularioProducto } from "@/components/admin/FormularioProducto";
import { Encabezado } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { esCategoria } from "@/lib/catalogo";
import { seriesExistentes } from "@/lib/db/productos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto({ searchParams }: PageProps<"/admin/productos/nuevo">) {
  await verificarSesion();
  const { cat } = await searchParams;
  const series = await seriesExistentes();
  return (
    <>
      <Encabezado titulo="Nuevo producto" />
      <FormularioProducto
        id={null}
        series={series}
        inicial={{
          nombre: "",
          slug: "",
          categoria: esCategoria(cat) ? cat : "figuras",
          serie: "",
          descripcion: "",
          precio: "",
          precioAnterior: "",
          costo: "",
          etiqueta: "",
          destacado: false,
          visible: true,
          imagenes: [],
        }}
      />
    </>
  );
}
