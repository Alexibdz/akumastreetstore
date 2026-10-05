import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { FormularioConfiguracion } from "@/components/admin/FormularioConfiguracion";
import { BotonConfirmar } from "@/components/admin/interactivos";
import { Encabezado, Tarjeta, claseBoton } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import { borrarOperacionesAccion } from "./acciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configuración" };

export default async function Configuracion() {
  await verificarSesion();
  const config = await obtenerConfiguracion();
  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Datos de contacto y cómo se ve la tienda. La contraseña del panel se cambia en el archivo .env.local (ADMIN_PASSWORD)." />
      <FormularioConfiguracion inicial={config} />
      <Tarjeta titulo="Empezar de cero">
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-muted">
            La base vino con ventas, gastos y movimientos de ejemplo. Antes de usarla de verdad, borralos: los productos y su stock actual quedan (después
            corregí el stock desde Stock con un ajuste).
          </p>
          <BotonConfirmar
            accion={borrarOperacionesAccion}
            pregunta="¿Borrar TODAS las ventas, gastos y movimientos de stock? Los productos quedan. No se puede deshacer."
            className={claseBoton("peligro", true)}
          >
            <Trash2 size={14} aria-hidden /> Borrar ventas, gastos y movimientos
          </BotonConfirmar>
        </div>
      </Tarjeta>
    </>
  );
}
