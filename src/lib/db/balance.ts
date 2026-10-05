import "server-only";
import { inicioDiaISO, rangoMes, sumarDias } from "@/lib/formato";
import { db } from "./conexion";

// Números del negocio. Las ventas anuladas no cuentan en nada.
// - Ingresos: lo cobrado en ventas (después de descuentos).
// - Egresos: los gastos cargados (incluye compras de mercadería).
// - Balance: ingresos - egresos (lo que entró menos lo que salió).
// - Ganancia bruta: ingresos - costo de lo vendido (cuánto deja cada venta antes de gastos fijos).

const DIA_AR = "substr(datetime(v.fecha, '-3 hours'), 1, 10)";
const MES_AR = "substr(datetime(v.fecha, '-3 hours'), 1, 7)";

export async function resumenMes(mes: string) {
  const { desdeISO, hastaISO, desdeDia, hastaDia } = rangoMes(mes);
  const conexion = db();

  const ventas = conexion
    .prepare(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total, COALESCE(SUM(descuento), 0) AS descuentos
       FROM ventas v WHERE anulada_en IS NULL AND fecha >= ? AND fecha < ?`,
    )
    .get(desdeISO, hastaISO) as { cantidad: number; total: number; descuentos: number };

  const items = conexion
    .prepare(
      `SELECT COALESCE(SUM(i.cantidad), 0) AS unidades,
              COALESCE(SUM(i.cantidad * i.costo_unitario), 0) AS costo,
              COALESCE(SUM(CASE WHEN i.costo_unitario IS NULL THEN i.cantidad ELSE 0 END), 0) AS sinCosto
       FROM venta_items i JOIN ventas v ON v.id = i.venta_id
       WHERE v.anulada_en IS NULL AND v.fecha >= ? AND v.fecha < ?`,
    )
    .get(desdeISO, hastaISO) as { unidades: number; costo: number; sinCosto: number };

  const porMedio = conexion
    .prepare(
      `SELECT medio_pago AS id, COUNT(*) AS cantidad, SUM(total) AS total FROM ventas v
       WHERE anulada_en IS NULL AND fecha >= ? AND fecha < ? GROUP BY medio_pago ORDER BY total DESC`,
    )
    .all(desdeISO, hastaISO) as { id: string; cantidad: number; total: number }[];

  const porCanal = conexion
    .prepare(
      `SELECT canal AS id, COUNT(*) AS cantidad, SUM(total) AS total FROM ventas v
       WHERE anulada_en IS NULL AND fecha >= ? AND fecha < ? GROUP BY canal ORDER BY total DESC`,
    )
    .all(desdeISO, hastaISO) as { id: string; cantidad: number; total: number }[];

  // Por categoría se suma el precio de lista de cada ítem (antes del descuento de la venta)
  const porCategoria = conexion
    .prepare(
      `SELECT COALESCE(p.categoria, 'otros') AS id, SUM(i.cantidad) AS unidades, SUM(i.cantidad * i.precio_unitario) AS total
       FROM venta_items i JOIN ventas v ON v.id = i.venta_id LEFT JOIN productos p ON p.id = i.producto_id
       WHERE v.anulada_en IS NULL AND v.fecha >= ? AND v.fecha < ? GROUP BY 1 ORDER BY total DESC`,
    )
    .all(desdeISO, hastaISO) as { id: string; unidades: number; total: number }[];

  const gastosPorCategoria = conexion
    .prepare(
      `SELECT categoria AS id, COUNT(*) AS cantidad, SUM(monto) AS total FROM gastos
       WHERE fecha >= ? AND fecha < ? GROUP BY categoria ORDER BY total DESC`,
    )
    .all(desdeDia, hastaDia) as { id: string; cantidad: number; total: number }[];
  const gastos = gastosPorCategoria.reduce((s, g) => s + g.total, 0);

  return {
    ventas,
    unidades: items.unidades,
    costoVendido: items.costo,
    unidadesSinCosto: items.sinCosto,
    gananciaBruta: ventas.total - items.costo,
    gastos,
    balance: ventas.total - gastos,
    porMedio,
    porCanal,
    porCategoria,
    gastosPorCategoria,
  };
}

export async function totalVentas(desdeISO: string, hastaISO: string) {
  return db()
    .prepare(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total FROM ventas
       WHERE anulada_en IS NULL AND fecha >= ? AND fecha < ?`,
    )
    .get(desdeISO, hastaISO) as { cantidad: number; total: number };
}

/** Total vendido por día, con los días sin ventas en 0. */
export async function ventasPorDia(desdeDia: string, hastaDia: string) {
  const filas = db()
    .prepare(
      `SELECT ${DIA_AR} AS dia, COUNT(*) AS cantidad, SUM(total) AS total FROM ventas v
       WHERE anulada_en IS NULL AND fecha >= ? AND fecha < ? GROUP BY dia`,
    )
    .all(inicioDiaISO(desdeDia), inicioDiaISO(hastaDia)) as { dia: string; cantidad: number; total: number }[];
  const porDia = new Map(filas.map((f) => [f.dia, f]));
  const dias: { dia: string; cantidad: number; total: number }[] = [];
  for (let d = desdeDia; d < hastaDia; d = sumarDias(d, 1)) dias.push(porDia.get(d) ?? { dia: d, cantidad: 0, total: 0 });
  return dias;
}

/** Ingresos y egresos de cada mes pedido ("2026-10", ...). */
export async function ingresosYEgresos(meses: string[]) {
  const ventas = db()
    .prepare(`SELECT ${MES_AR} AS mes, SUM(total) AS total FROM ventas v WHERE anulada_en IS NULL GROUP BY mes`)
    .all() as { mes: string; total: number }[];
  const gastos = db().prepare("SELECT substr(fecha, 1, 7) AS mes, SUM(monto) AS total FROM gastos GROUP BY mes").all() as {
    mes: string;
    total: number;
  }[];
  const ingreso = new Map(ventas.map((v) => [v.mes, v.total]));
  const egreso = new Map(gastos.map((g) => [g.mes, g.total]));
  return meses.map((mes) => ({ mes, ingresos: ingreso.get(mes) ?? 0, egresos: egreso.get(mes) ?? 0 }));
}

export async function masVendidos(desdeISO: string, hastaISO: string, limite = 5) {
  return db()
    .prepare(
      `SELECT COALESCE(p.nombre, i.descripcion) AS nombre, i.producto_id AS productoId,
              SUM(i.cantidad) AS unidades, SUM(i.cantidad * i.precio_unitario) AS total
       FROM venta_items i JOIN ventas v ON v.id = i.venta_id LEFT JOIN productos p ON p.id = i.producto_id
       WHERE v.anulada_en IS NULL AND v.fecha >= ? AND v.fecha < ?
       GROUP BY COALESCE(CAST(i.producto_id AS TEXT), i.descripcion)
       ORDER BY unidades DESC, total DESC LIMIT ?`,
    )
    .all(desdeISO, hastaISO, limite) as { nombre: string; productoId: number | null; unidades: number; total: number }[];
}
