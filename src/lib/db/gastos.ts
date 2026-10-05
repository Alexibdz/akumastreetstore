import "server-only";
import type { Gasto } from "@/lib/tipos";
import { ahoraISO, db } from "./conexion";

export async function listarGastos(filtro: { desdeDia: string; hastaDia: string }): Promise<Gasto[]> {
  return db()
    .prepare(
      `SELECT id, fecha, categoria, descripcion, monto FROM gastos
       WHERE fecha >= ? AND fecha < ? ORDER BY fecha DESC, id DESC`,
    )
    .all(filtro.desdeDia, filtro.hastaDia) as Gasto[];
}

export async function crearGasto(g: Omit<Gasto, "id">): Promise<void> {
  db()
    .prepare("INSERT INTO gastos (fecha, categoria, descripcion, monto, creado_en) VALUES (?, ?, ?, ?, ?)")
    .run(g.fecha, g.categoria, g.descripcion, g.monto, ahoraISO());
}

export async function eliminarGasto(id: number): Promise<void> {
  db().prepare("DELETE FROM gastos WHERE id = ?").run(id);
}
