import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { BASE_DEMO, CARPETA_DATOS, DISCO_SOLO_LECTURA } from "@/lib/disco";
import { cargarSemilla } from "./semilla";

// Base local SQLite en ./data/akuma.db (o DATABASE_PATH). En Vercel, una copia de demo/akuma.db en /tmp.
// Toda la app accede a los datos por las funciones de src/lib/db/*: para pasar a Supabase
// se reescriben esos módulos y el resto queda igual.
const DB_PATH = process.env.DATABASE_PATH || path.join(/*turbopackIgnore: true*/ CARPETA_DATOS, "akuma.db");

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS productos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  nombre          TEXT NOT NULL,
  categoria       TEXT NOT NULL,
  serie           TEXT NOT NULL DEFAULT '',
  descripcion     TEXT NOT NULL DEFAULT '',
  precio          INTEGER NOT NULL,
  precio_anterior INTEGER,          -- si está, el producto está en oferta
  costo           INTEGER,          -- costo unitario de reposición
  etiqueta        TEXT,             -- NUEVO | PREVENTA
  destacado       INTEGER NOT NULL DEFAULT 0,
  visible         INTEGER NOT NULL DEFAULT 1,
  imagenes        TEXT NOT NULL DEFAULT '[]', -- JSON con las URLs, la primera es la portada
  creado_en       TEXT NOT NULL,
  actualizado_en  TEXT NOT NULL
);

-- Talles. Un producto sin talles tiene una sola variante con nombre ''.
CREATE TABLE IF NOT EXISTS variantes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL DEFAULT '',
  stock       INTEGER NOT NULL DEFAULT 0,
  orden       INTEGER NOT NULL DEFAULT 0,
  activa      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS variantes_producto ON variantes(producto_id);

CREATE TABLE IF NOT EXISTS ventas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha      TEXT NOT NULL,  -- ISO UTC
  cliente    TEXT NOT NULL DEFAULT '',
  canal      TEXT NOT NULL,
  medio_pago TEXT NOT NULL,
  subtotal   INTEGER NOT NULL,
  descuento  INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL,
  notas      TEXT NOT NULL DEFAULT '',
  anulada_en TEXT
);
CREATE INDEX IF NOT EXISTS ventas_fecha ON ventas(fecha);

CREATE TABLE IF NOT EXISTS venta_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id        INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  variante_id     INTEGER REFERENCES variantes(id) ON DELETE SET NULL,
  descripcion     TEXT NOT NULL,   -- copia del nombre al momento de vender
  cantidad        INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL,
  costo_unitario  INTEGER          -- copia del costo al momento de vender
);
CREATE INDEX IF NOT EXISTS venta_items_venta ON venta_items(venta_id);

CREATE TABLE IF NOT EXISTS gastos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha       TEXT NOT NULL,  -- YYYY-MM-DD (hora argentina)
  categoria   TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  monto       INTEGER NOT NULL,
  creado_en   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS gastos_fecha ON gastos(fecha);

-- Historial de stock: cada cambio queda registrado con el stock que quedó.
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha            TEXT NOT NULL,
  variante_id      INTEGER NOT NULL REFERENCES variantes(id) ON DELETE CASCADE,
  tipo             TEXT NOT NULL,  -- inicial | ingreso | venta | anulacion | ajuste
  cantidad         INTEGER NOT NULL, -- positivo entra, negativo sale
  stock_resultante INTEGER NOT NULL,
  costo_unitario   INTEGER,
  nota             TEXT NOT NULL DEFAULT '',
  venta_id         INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
  gasto_id         INTEGER REFERENCES gastos(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS movimientos_variante ON movimientos_stock(variante_id);
CREATE INDEX IF NOT EXISTS movimientos_fecha ON movimientos_stock(fecha);

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL  -- JSON
);
`;

const cache = globalThis as unknown as { __akumaDb?: Database.Database };

/** Conexión única (en desarrollo Next recarga módulos: se guarda en globalThis). */
export function db(): Database.Database {
  if (!cache.__akumaDb) {
    let nueva = !fs.existsSync(DB_PATH);
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    if (nueva && DISCO_SOLO_LECTURA && fs.existsSync(BASE_DEMO)) {
      fs.copyFileSync(BASE_DEMO, DB_PATH);
      nueva = false;
    }
    const conexion = new Database(DB_PATH);
    conexion.pragma("journal_mode = WAL");
    conexion.pragma("foreign_keys = ON");
    conexion.exec(ESQUEMA);
    if (nueva) cargarSemilla(conexion);
    cache.__akumaDb = conexion;
  }
  return cache.__akumaDb;
}

/** Ejecuta fn dentro de una transacción (todo o nada). */
export function transaccion<T>(fn: () => T): T {
  return db().transaction(fn)();
}

export const ahoraISO = () => new Date().toISOString();
