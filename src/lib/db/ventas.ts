import "server-only";
import { diaAR } from "@/lib/formato";
import { normalizar } from "@/lib/texto";
import type { Venta, VentaItem } from "@/lib/tipos";
import { ahoraISO, db, transaccion } from "./conexion";
import { ErrorNegocio } from "./errores";

type FilaVenta = {
  id: number;
  fecha: string;
  cliente: string;
  canal: string;
  medio_pago: string;
  subtotal: number;
  descuento: number;
  total: number;
  notas: string;
  anulada_en: string | null;
};

type FilaItem = {
  id: number;
  venta_id: number;
  producto_id: number | null;
  variante_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number | null;
};

function conItems(filas: FilaVenta[]): Venta[] {
  if (filas.length === 0) return [];
  const items = db()
    .prepare(`SELECT * FROM venta_items WHERE venta_id IN (${filas.map(() => "?").join(",")}) ORDER BY id`)
    .all(...filas.map((f) => f.id)) as FilaItem[];
  const porVenta = new Map<number, VentaItem[]>();
  for (const i of items) {
    const lista = porVenta.get(i.venta_id) ?? [];
    lista.push({
      id: i.id,
      productoId: i.producto_id,
      varianteId: i.variante_id,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      costoUnitario: i.costo_unitario,
    });
    porVenta.set(i.venta_id, lista);
  }
  return filas.map((f) => ({
    id: f.id,
    fecha: f.fecha,
    cliente: f.cliente,
    canal: f.canal,
    medioPago: f.medio_pago,
    subtotal: f.subtotal,
    descuento: f.descuento,
    total: f.total,
    notas: f.notas,
    anuladaEn: f.anulada_en,
    items: porVenta.get(f.id) ?? [],
  }));
}

export async function listarVentas(filtro: { desdeISO?: string; hastaISO?: string; q?: string; limite?: number }): Promise<Venta[]> {
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (filtro.desdeISO) {
    condiciones.push("fecha >= ?");
    params.push(filtro.desdeISO);
  }
  if (filtro.hastaISO) {
    condiciones.push("fecha < ?");
    params.push(filtro.hastaISO);
  }
  const filas = db()
    .prepare(
      `SELECT * FROM ventas ${condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : ""}
       ORDER BY fecha DESC, id DESC ${filtro.limite ? `LIMIT ${Math.floor(filtro.limite)}` : ""}`,
    )
    .all(...params) as FilaVenta[];
  const ventas = conItems(filas);
  if (!filtro.q) return ventas;
  const q = normalizar(filtro.q);
  return ventas.filter((v) => normalizar(`${v.cliente} ${v.notas} ${v.items.map((i) => i.descripcion).join(" ")}`).includes(q));
}

export async function obtenerVenta(id: number): Promise<Venta | null> {
  const fila = db().prepare("SELECT * FROM ventas WHERE id = ?").get(id) as FilaVenta | undefined;
  return fila ? conItems([fila])[0] : null;
}

export type DatosVenta = {
  items: { varianteId: number; cantidad: number; precioUnitario: number }[];
  descuento: number;
  medioPago: string;
  canal: string;
  cliente: string;
  notas: string;
  dia: string; // YYYY-MM-DD; si es hoy se usa la hora actual
};

type VarianteParaVenta = {
  id: number;
  nombre: string;
  stock: number;
  producto_id: number;
  producto: string;
  costo: number | null;
  etiqueta: string | null;
};

/**
 * Registra la venta y descuenta el stock en una sola transacción.
 * Las preventas se pueden vender sin stock (queda negativo hasta que entra la mercadería).
 */
export async function registrarVenta(d: DatosVenta): Promise<number> {
  return transaccion(() => {
    const buscar = db().prepare(
      `SELECT v.id, v.nombre, v.stock, p.id AS producto_id, p.nombre AS producto, p.costo, p.etiqueta
       FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.id = ? AND v.activa = 1`,
    );
    const lineas = d.items.map((item) => {
      const v = buscar.get(item.varianteId) as VarianteParaVenta | undefined;
      if (!v) throw new ErrorNegocio("Uno de los productos ya no existe. Recargá la página.");
      const descripcion = v.nombre ? `${v.producto} (${v.nombre})` : v.producto;
      if (item.cantidad > v.stock && v.etiqueta !== "PREVENTA") {
        throw new ErrorNegocio(`No hay stock suficiente de ${descripcion}: quedan ${v.stock}.`);
      }
      return { ...item, v, descripcion };
    });

    const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
    const descuento = Math.min(Math.max(0, d.descuento), subtotal);
    const fecha = d.dia === diaAR() ? ahoraISO() : new Date(`${d.dia}T12:00:00-03:00`).toISOString();

    const ventaId = Number(
      db()
        .prepare(
          `INSERT INTO ventas (fecha, cliente, canal, medio_pago, subtotal, descuento, total, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(fecha, d.cliente, d.canal, d.medioPago, subtotal, descuento, subtotal - descuento, d.notas).lastInsertRowid,
    );

    const insItem = db().prepare(
      `INSERT INTO venta_items (venta_id, producto_id, variante_id, descripcion, cantidad, precio_unitario, costo_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const bajarStock = db().prepare("UPDATE variantes SET stock = stock - ? WHERE id = ? RETURNING stock");
    const insMov = db().prepare(
      `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, venta_id)
       VALUES (?, ?, 'venta', ?, ?, ?)`,
    );
    for (const l of lineas) {
      insItem.run(ventaId, l.v.producto_id, l.v.id, l.descripcion, l.cantidad, l.precioUnitario, l.v.costo);
      const { stock } = bajarStock.get(l.cantidad, l.v.id) as { stock: number };
      insMov.run(fecha, l.v.id, -l.cantidad, stock, ventaId);
    }
    return ventaId;
  });
}

/** Marca la venta como anulada y devuelve el stock. No se puede deshacer. */
export async function anularVenta(id: number): Promise<void> {
  transaccion(() => {
    const venta = db().prepare("SELECT anulada_en FROM ventas WHERE id = ?").get(id) as { anulada_en: string | null } | undefined;
    if (!venta) throw new ErrorNegocio("La venta no existe.");
    if (venta.anulada_en) throw new ErrorNegocio("La venta ya estaba anulada.");
    const ahora = ahoraISO();
    const items = db().prepare("SELECT variante_id, cantidad FROM venta_items WHERE venta_id = ? AND variante_id IS NOT NULL").all(id) as {
      variante_id: number;
      cantidad: number;
    }[];
    const subirStock = db().prepare("UPDATE variantes SET stock = stock + ? WHERE id = ? RETURNING stock");
    const insMov = db().prepare(
      `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, venta_id)
       VALUES (?, ?, 'anulacion', ?, ?, ?)`,
    );
    for (const i of items) {
      const fila = subirStock.get(i.cantidad, i.variante_id) as { stock: number } | undefined;
      if (fila) insMov.run(ahora, i.variante_id, i.cantidad, fila.stock, id);
    }
    db().prepare("UPDATE ventas SET anulada_en = ? WHERE id = ?").run(ahora, id);
  });
}
