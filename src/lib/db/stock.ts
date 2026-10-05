import "server-only";
import type { CategoriaSlug, TipoMovimiento } from "@/lib/catalogo";
import { diaAR } from "@/lib/formato";
import { normalizar } from "@/lib/texto";
import type { FilaStock, Movimiento } from "@/lib/tipos";
import { ahoraISO, db, transaccion } from "./conexion";
import { ErrorNegocio } from "./errores";

type Fila = {
  variante_id: number;
  producto_id: number;
  producto: string;
  slug: string;
  talle: string;
  categoria: CategoriaSlug;
  serie: string;
  stock: number;
  costo: number | null;
  precio: number;
  etiqueta: string | null;
  visible: number;
};

const SELECT_STOCK = `
  SELECT v.id AS variante_id, p.id AS producto_id, p.nombre AS producto, p.slug, v.nombre AS talle, p.categoria, p.serie,
         v.stock, p.costo, p.precio, p.etiqueta, p.visible
  FROM variantes v JOIN productos p ON p.id = v.producto_id
  WHERE v.activa = 1`;

const aFila = (f: Fila): FilaStock => ({
  varianteId: f.variante_id,
  productoId: f.producto_id,
  producto: f.producto,
  slug: f.slug,
  talle: f.talle,
  categoria: f.categoria,
  serie: f.serie,
  stock: f.stock,
  costo: f.costo,
  precio: f.precio,
  preventa: f.etiqueta === "PREVENTA",
  visible: f.visible === 1,
});

export async function filasStock(filtro: { q?: string; categoria?: CategoriaSlug; bajoHasta?: number } = {}): Promise<FilaStock[]> {
  const filas = (db().prepare(`${SELECT_STOCK} ORDER BY p.nombre, v.orden`).all() as Fila[]).map(aFila);
  return filas.filter(
    (f) =>
      (!filtro.categoria || f.categoria === filtro.categoria) &&
      (filtro.bajoHasta === undefined || f.stock <= filtro.bajoHasta) &&
      (!filtro.q || normalizar(`${f.producto} ${f.talle} ${f.serie}`).includes(normalizar(filtro.q))),
  );
}

/** Talles con stock en el umbral o por debajo, de menor a mayor. No cuentan preventas ni productos ocultos. */
export async function stockBajo(umbral: number): Promise<FilaStock[]> {
  return (
    db()
      .prepare(
        `${SELECT_STOCK} AND v.stock <= ? AND p.visible = 1 AND (p.etiqueta IS NULL OR p.etiqueta <> 'PREVENTA')
         ORDER BY v.stock, p.nombre`,
      )
      .all(umbral) as Fila[]
  ).map(aFila);
}

export async function valorInventario() {
  return db()
    .prepare(
      `SELECT COALESCE(SUM(v.stock), 0) AS unidades,
              COALESCE(SUM(v.stock * p.costo), 0) AS aCosto,
              COALESCE(SUM(v.stock * p.precio), 0) AS aPrecio,
              COALESCE(SUM(CASE WHEN p.costo IS NULL AND v.stock > 0 THEN 1 ELSE 0 END), 0) AS sinCosto
       FROM variantes v JOIN productos p ON p.id = v.producto_id
       WHERE v.activa = 1 AND v.stock > 0`,
    )
    .get() as { unidades: number; aCosto: number; aPrecio: number; sinCosto: number };
}

function variante(id: number) {
  const v = db()
    .prepare(
      `SELECT v.id, v.nombre, v.stock, p.id AS producto_id, p.nombre AS producto
       FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.id = ? AND v.activa = 1`,
    )
    .get(id) as { id: number; nombre: string; stock: number; producto_id: number; producto: string } | undefined;
  if (!v) throw new ErrorNegocio("Ese producto o talle ya no existe.");
  return { ...v, descripcion: v.nombre ? `${v.producto} (${v.nombre})` : v.producto };
}

export type DatosIngreso = {
  varianteId: number;
  cantidad: number;
  costoUnitario: number | null;
  registrarGasto: boolean;
  actualizarCosto: boolean;
  nota: string;
};

/** Entrada de mercadería. Opcionalmente la anota como gasto y actualiza el costo del producto. */
export async function ingresarStock(d: DatosIngreso): Promise<void> {
  transaccion(() => {
    const v = variante(d.varianteId);
    const ahora = ahoraISO();
    let gastoId: number | null = null;
    if (d.registrarGasto && d.costoUnitario) {
      gastoId = Number(
        db()
          .prepare("INSERT INTO gastos (fecha, categoria, descripcion, monto, creado_en) VALUES (?, 'mercaderia', ?, ?, ?)")
          .run(diaAR(), `Ingreso: ${v.descripcion} x${d.cantidad}`, d.cantidad * d.costoUnitario, ahora).lastInsertRowid,
      );
    }
    const { stock } = db().prepare("UPDATE variantes SET stock = stock + ? WHERE id = ? RETURNING stock").get(d.cantidad, v.id) as {
      stock: number;
    };
    db()
      .prepare(
        `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, costo_unitario, nota, gasto_id)
         VALUES (?, ?, 'ingreso', ?, ?, ?, ?, ?)`,
      )
      .run(ahora, v.id, d.cantidad, stock, d.costoUnitario, d.nota, gastoId);
    if (d.actualizarCosto && d.costoUnitario) {
      db().prepare("UPDATE productos SET costo = ?, actualizado_en = ? WHERE id = ?").run(d.costoUnitario, ahora, v.producto_id);
    }
  });
}

/** Corrige el stock al valor contado (rotura, pérdida, conteo...). */
export async function ajustarStock(d: { varianteId: number; stockReal: number; motivo: string; nota: string }): Promise<void> {
  transaccion(() => {
    const v = variante(d.varianteId);
    const diferencia = d.stockReal - v.stock;
    if (diferencia === 0) throw new ErrorNegocio(`El stock de ${v.descripcion} ya es ${v.stock}.`);
    db().prepare("UPDATE variantes SET stock = ? WHERE id = ?").run(d.stockReal, v.id);
    db()
      .prepare(
        `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, nota)
         VALUES (?, ?, 'ajuste', ?, ?, ?)`,
      )
      .run(ahoraISO(), v.id, diferencia, d.stockReal, d.nota ? `${d.motivo}: ${d.nota}` : d.motivo);
  });
}

export async function movimientos(filtro: { productoId?: number; limite?: number } = {}): Promise<Movimiento[]> {
  const filas = db()
    .prepare(
      `SELECT m.id, m.fecha, m.variante_id, p.nombre AS producto, p.id AS producto_id, v.nombre AS talle, m.tipo, m.cantidad,
              m.stock_resultante, m.costo_unitario, m.nota, m.venta_id
       FROM movimientos_stock m
       JOIN variantes v ON v.id = m.variante_id
       JOIN productos p ON p.id = v.producto_id
       ${filtro.productoId ? "WHERE p.id = ?" : ""}
       ORDER BY m.fecha DESC, m.id DESC LIMIT ?`,
    )
    .all(...(filtro.productoId ? [filtro.productoId] : []), filtro.limite ?? 300) as {
    id: number;
    fecha: string;
    variante_id: number;
    producto: string;
    producto_id: number;
    talle: string;
    tipo: TipoMovimiento;
    cantidad: number;
    stock_resultante: number;
    costo_unitario: number | null;
    nota: string;
    venta_id: number | null;
  }[];
  return filas.map((f) => ({
    id: f.id,
    fecha: f.fecha,
    varianteId: f.variante_id,
    producto: f.producto,
    productoId: f.producto_id,
    talle: f.talle,
    tipo: f.tipo,
    cantidad: f.cantidad,
    stockResultante: f.stock_resultante,
    costoUnitario: f.costo_unitario,
    nota: f.nota,
    ventaId: f.venta_id,
  }));
}
