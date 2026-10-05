import "server-only";
import type { Configuracion } from "@/lib/tipos";
import { db, transaccion } from "./conexion";

export const WHATSAPP_DE_EJEMPLO = "5491100000000";

const POR_DEFECTO: Configuracion = {
  whatsapp: WHATSAPP_DE_EJEMPLO,
  instagram: "akuma.street.26",
  mostrarPrecios: true,
  umbralStockBajo: 2,
};

function leer(clave: string): unknown {
  const fila = db().prepare("SELECT valor FROM configuracion WHERE clave = ?").get(clave) as { valor: string } | undefined;
  return fila ? JSON.parse(fila.valor) : undefined;
}

function escribir(clave: string, valor: unknown) {
  db()
    .prepare("INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor")
    .run(clave, JSON.stringify(valor));
}

/** La configuración guardada, completada con los valores por defecto. */
export async function obtenerConfiguracion(): Promise<Configuracion> {
  const config = { ...POR_DEFECTO };
  for (const clave of Object.keys(POR_DEFECTO) as (keyof Configuracion)[]) {
    const valor = leer(clave);
    if (valor !== undefined) Object.assign(config, { [clave]: valor });
  }
  return config;
}

export async function guardarConfiguracion(cambios: Partial<Configuracion>): Promise<void> {
  transaccion(() => {
    for (const [clave, valor] of Object.entries(cambios)) escribir(clave, valor);
  });
}

/** Borra el historial operativo (ventas, gastos y movimientos). Los productos y su stock actual quedan. */
export async function borrarOperaciones(): Promise<void> {
  transaccion(() => {
    db().exec("DELETE FROM movimientos_stock; DELETE FROM venta_items; DELETE FROM ventas; DELETE FROM gastos;");
  });
}
