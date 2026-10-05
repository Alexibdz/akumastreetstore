import type { Metadata } from "next";
import { PuntoDeVenta, type ItemVendible } from "@/components/admin/PuntoDeVenta";
import { Encabezado } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { productosAdmin } from "@/lib/db/productos";
import { diaAR } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva venta" };

export default async function NuevaVenta() {
  await verificarSesion();
  const productos = await productosAdmin();
  // Una fila por talle; los ocultos también se pueden vender en el local
  const items: ItemVendible[] = productos.flatMap((p) =>
    p.variantes.map((v) => ({
      varianteId: v.id,
      nombre: p.nombre,
      talle: v.nombre,
      serie: p.serie,
      categoria: p.categoria,
      precio: p.precio,
      stock: v.stock,
      preventa: p.etiqueta === "PREVENTA",
      imagen: p.imagenes[0] ?? null,
    })),
  );

  return (
    <>
      <Encabezado titulo="Nueva venta" descripcion="Al registrarla se descuenta el stock. Si te equivocás, la podés anular desde el detalle." />
      <PuntoDeVenta items={items} hoy={diaAR()} />
    </>
  );
}
