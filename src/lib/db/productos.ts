import "server-only";
import type { CategoriaSlug, Etiqueta } from "@/lib/catalogo";
import { normalizar, slugify } from "@/lib/texto";
import type { Producto, ProductoPublico, Variante } from "@/lib/tipos";
import { ahoraISO, db, transaccion } from "./conexion";
import { ErrorNegocio } from "./errores";

type FilaProducto = {
  id: number;
  slug: string;
  nombre: string;
  categoria: CategoriaSlug;
  serie: string;
  descripcion: string;
  precio: number;
  precio_anterior: number | null;
  costo: number | null;
  etiqueta: Etiqueta | null;
  destacado: number;
  visible: number;
  imagenes: string;
  creado_en: string;
  actualizado_en: string;
};

type FilaVariante = Variante & { producto_id: number };

function variantesPorProducto(ids: number[]) {
  const mapa = new Map<number, Variante[]>();
  if (ids.length === 0) return mapa;
  const filas = db()
    .prepare(
      `SELECT id, producto_id, nombre, stock FROM variantes
       WHERE activa = 1 AND producto_id IN (${ids.map(() => "?").join(",")}) ORDER BY orden, id`,
    )
    .all(...ids) as FilaVariante[];
  for (const f of filas) {
    const lista = mapa.get(f.producto_id) ?? [];
    lista.push({ id: f.id, nombre: f.nombre, stock: f.stock });
    mapa.set(f.producto_id, lista);
  }
  return mapa;
}

function aProductos(filas: FilaProducto[]): Producto[] {
  const variantes = variantesPorProducto(filas.map((f) => f.id));
  return filas.map((f) => {
    const vs = variantes.get(f.id) ?? [];
    return {
      id: f.id,
      slug: f.slug,
      nombre: f.nombre,
      categoria: f.categoria,
      serie: f.serie,
      descripcion: f.descripcion,
      precio: f.precio,
      precioAnterior: f.precio_anterior,
      costo: f.costo,
      etiqueta: f.etiqueta,
      destacado: f.destacado === 1,
      visible: f.visible === 1,
      imagenes: JSON.parse(f.imagenes) as string[],
      variantes: vs,
      stock: vs.reduce((s, v) => s + v.stock, 0),
      creadoEn: f.creado_en,
      actualizadoEn: f.actualizado_en,
    };
  });
}

/** Saca los datos internos (costo, visibilidad) antes de mandarlos a la tienda. */
function aPublico(p: Producto): ProductoPublico {
  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    serie: p.serie,
    descripcion: p.descripcion,
    precio: p.precio,
    precioAnterior: p.precioAnterior,
    etiqueta: p.etiqueta,
    destacado: p.destacado,
    imagenes: p.imagenes,
    variantes: p.variantes,
    stock: p.stock,
  };
}

export const enOferta = (p: { precio: number; precioAnterior: number | null }) =>
  p.precioAnterior !== null && p.precioAnterior > p.precio;

const coincide = (p: Producto, q: string) =>
  normalizar(`${p.nombre} ${p.serie} ${p.categoria} ${p.descripcion}`).includes(normalizar(q));

// ---------------------------------------------------------------------------
// Tienda
// ---------------------------------------------------------------------------

export type FiltroCatalogo = { categoria?: CategoriaSlug; serie?: string; ofertas?: boolean };

/** Productos visibles: destacados primero, después los que tienen stock, después los más nuevos. */
export async function productosPublicos(filtro: FiltroCatalogo = {}): Promise<ProductoPublico[]> {
  const condiciones = ["visible = 1"];
  const params: unknown[] = [];
  if (filtro.categoria) {
    condiciones.push("categoria = ?");
    params.push(filtro.categoria);
  }
  if (filtro.serie) {
    condiciones.push("serie = ? COLLATE NOCASE");
    params.push(filtro.serie);
  }
  if (filtro.ofertas) condiciones.push("precio_anterior > precio");

  const filas = db()
    .prepare(`SELECT * FROM productos WHERE ${condiciones.join(" AND ")} ORDER BY id DESC`)
    .all(...params) as FilaProducto[];
  const disponible = (p: Producto) => (p.stock > 0 || p.etiqueta === "PREVENTA" ? 1 : 0);
  return aProductos(filas)
    .sort((a, b) => Number(b.destacado) - Number(a.destacado) || disponible(b) - disponible(a))
    .map(aPublico);
}

export async function productoPublico(slug: string): Promise<ProductoPublico | null> {
  const fila = db().prepare("SELECT * FROM productos WHERE slug = ? AND visible = 1").get(slug) as FilaProducto | undefined;
  return fila ? aPublico(aProductos([fila])[0]) : null;
}

/** Series con productos visibles, de la más grande a la más chica. */
export async function seriesPublicas(categoria?: CategoriaSlug) {
  return db()
    .prepare(
      `SELECT serie AS nombre, COUNT(*) AS cantidad FROM productos
       WHERE visible = 1 AND serie <> '' ${categoria ? "AND categoria = ?" : ""}
       GROUP BY serie ORDER BY cantidad DESC, serie`,
    )
    .all(...(categoria ? [categoria] : [])) as { nombre: string; cantidad: number }[];
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export async function productosAdmin(filtro: { q?: string; categoria?: CategoriaSlug } = {}): Promise<Producto[]> {
  const filas = db()
    .prepare(`SELECT * FROM productos ${filtro.categoria ? "WHERE categoria = ?" : ""} ORDER BY id DESC`)
    .all(...(filtro.categoria ? [filtro.categoria] : [])) as FilaProducto[];
  return aProductos(filas).filter((p) => !filtro.q || coincide(p, filtro.q));
}

export async function productoAdmin(id: number): Promise<Producto | null> {
  const fila = db().prepare("SELECT * FROM productos WHERE id = ?").get(id) as FilaProducto | undefined;
  return fila ? aProductos([fila])[0] : null;
}

export async function seriesExistentes(): Promise<string[]> {
  const filas = db().prepare("SELECT DISTINCT serie FROM productos WHERE serie <> '' ORDER BY serie").all() as { serie: string }[];
  return filas.map((f) => f.serie);
}

export type DatosProducto = {
  nombre: string;
  slug: string;
  categoria: CategoriaSlug;
  serie: string;
  descripcion: string;
  precio: number;
  precioAnterior: number | null;
  costo: number | null;
  etiqueta: Etiqueta | null;
  destacado: boolean;
  visible: boolean;
  imagenes: string[];
  /** Sin talles: [{ nombre: "" }]. Con talles: uno por talle. stockInicial solo se usa al crear. */
  variantes: { id?: number; nombre: string; stockInicial?: number }[];
};

function slugLibre(base: string, excluirId?: number) {
  const raiz = slugify(base) || "producto";
  const existe = db().prepare("SELECT 1 FROM productos WHERE slug = ? AND id IS NOT ?");
  let slug = raiz;
  for (let n = 2; existe.get(slug, excluirId ?? null); n++) slug = `${raiz}-${n}`;
  return slug;
}

const columnas = (d: DatosProducto) => [
  d.nombre,
  d.categoria,
  d.serie,
  d.descripcion,
  d.precio,
  d.precioAnterior,
  d.costo,
  d.etiqueta,
  d.destacado ? 1 : 0,
  d.visible ? 1 : 0,
  JSON.stringify(d.imagenes),
];

export async function crearProducto(d: DatosProducto): Promise<number> {
  return transaccion(() => {
    const ahora = ahoraISO();
    const { lastInsertRowid } = db()
      .prepare(
        `INSERT INTO productos (nombre, categoria, serie, descripcion, precio, precio_anterior, costo, etiqueta, destacado, visible, imagenes, slug, creado_en, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(...columnas(d), slugLibre(d.slug || d.nombre), ahora, ahora);
    const id = Number(lastInsertRowid);

    const insVariante = db().prepare("INSERT INTO variantes (producto_id, nombre, stock, orden) VALUES (?, ?, ?, ?)");
    const insMov = db().prepare(
      `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, costo_unitario, nota)
       VALUES (?, ?, 'inicial', ?, ?, ?, '')`,
    );
    const variantes = d.variantes.length > 0 ? d.variantes : [{ nombre: "", stockInicial: 0 }];
    variantes.forEach((v, orden) => {
      const stock = Math.max(0, Math.floor(v.stockInicial ?? 0));
      const varianteId = Number(insVariante.run(id, v.nombre, stock, orden).lastInsertRowid);
      if (stock > 0) insMov.run(ahora, varianteId, stock, stock, d.costo);
    });
    return id;
  });
}

export async function actualizarProducto(id: number, d: DatosProducto): Promise<void> {
  transaccion(() => {
    const { changes } = db()
      .prepare(
        `UPDATE productos SET nombre = ?, categoria = ?, serie = ?, descripcion = ?, precio = ?, precio_anterior = ?, costo = ?,
           etiqueta = ?, destacado = ?, visible = ?, imagenes = ?, slug = ?, actualizado_en = ?
         WHERE id = ?`,
      )
      .run(...columnas(d), slugLibre(d.slug || d.nombre, id), ahoraISO(), id);
    if (changes === 0) throw new ErrorNegocio("El producto ya no existe");
    sincronizarVariantes(id, d.variantes);
  });
}

/**
 * Deja los talles del producto como pide el formulario sin perder historial:
 * renombra los existentes, agrega los nuevos con stock 0 y quita los que ya no están
 * (solo si tienen stock 0; si tienen historial se desactivan en vez de borrarse).
 */
function sincronizarVariantes(productoId: number, entrada: DatosProducto["variantes"]) {
  const actuales = db()
    .prepare("SELECT id, nombre, stock FROM variantes WHERE producto_id = ? AND activa = 1")
    .all(productoId) as Variante[];
  const conTalles = entrada.some((v) => v.nombre.trim() !== "");
  const sinTalle = actuales.find((a) => a.nombre === "");
  const deseadas = conTalles
    ? entrada.filter((v) => v.nombre.trim() !== "").map((v) => ({ id: actuales.some((a) => a.id === v.id) ? v.id : undefined, nombre: v.nombre.trim() }))
    : [{ id: sinTalle?.id, nombre: "" }];

  const conservadas = new Set(deseadas.map((v) => v.id).filter(Boolean));
  const usada = db().prepare(
    "SELECT 1 FROM movimientos_stock WHERE variante_id = ? UNION SELECT 1 FROM venta_items WHERE variante_id = ? LIMIT 1",
  );
  for (const a of actuales) {
    if (conservadas.has(a.id)) continue;
    if (a.stock !== 0) {
      throw new ErrorNegocio(
        a.nombre
          ? `Para quitar el talle ${a.nombre} primero dejalo en 0 desde Stock (tiene ${a.stock}).`
          : `Para pasar a talles primero dejá el stock en 0 desde Stock (tiene ${a.stock}) y después cargalo por talle.`,
      );
    }
    if (usada.get(a.id, a.id)) db().prepare("UPDATE variantes SET activa = 0 WHERE id = ?").run(a.id);
    else db().prepare("DELETE FROM variantes WHERE id = ?").run(a.id);
  }

  const renombrar = db().prepare("UPDATE variantes SET nombre = ?, orden = ? WHERE id = ?");
  const insertar = db().prepare("INSERT INTO variantes (producto_id, nombre, stock, orden) VALUES (?, ?, 0, ?)");
  deseadas.forEach((v, orden) => {
    if (v.id) renombrar.run(v.nombre, orden, v.id);
    else insertar.run(productoId, v.nombre, orden);
  });
}

/** Solo se pueden borrar productos sin ventas; los que tienen ventas se ocultan. */
export async function eliminarProducto(id: number): Promise<void> {
  const conVentas = db().prepare("SELECT 1 FROM venta_items WHERE producto_id = ? LIMIT 1").get(id);
  if (conVentas) throw new ErrorNegocio("Este producto tiene ventas registradas: ocultalo de la tienda en vez de borrarlo.");
  db().prepare("DELETE FROM productos WHERE id = ?").run(id);
}

export async function alternarProducto(id: number, campo: "visible" | "destacado"): Promise<void> {
  db().prepare(`UPDATE productos SET ${campo} = 1 - ${campo}, actualizado_en = ? WHERE id = ?`).run(ahoraISO(), id);
}
