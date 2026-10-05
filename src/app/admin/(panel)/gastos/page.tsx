import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { Barra, COLOR_EGRESOS } from "@/components/admin/datos";
import { FormularioGasto } from "@/components/admin/FormularioGasto";
import { BotonConfirmar, SelectorMes } from "@/components/admin/interactivos";
import { Encabezado, Tarjeta, Vacio } from "@/components/admin/ui";
import { verificarSesion } from "@/lib/auth";
import { CATEGORIAS_GASTO, nombreDe } from "@/lib/catalogo";
import { listarGastos } from "@/lib/db/gastos";
import { diaAR, esMes, fechaDia, mesAR, nombreMes, precio, rangoMes } from "@/lib/formato";
import { eliminarGastoAccion } from "./acciones";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gastos" };

export default async function Gastos({ searchParams }: PageProps<"/admin/gastos">) {
  await verificarSesion();
  const sp = await searchParams;
  const mes = esMes(sp.mes) ? sp.mes : mesAR();
  const { desdeDia, hastaDia } = rangoMes(mes);
  const gastos = await listarGastos({ desdeDia, hastaDia });
  const total = gastos.reduce((s, g) => s + g.monto, 0);

  const porCategoria = CATEGORIAS_GASTO.map((c) => ({
    ...c,
    total: gastos.filter((g) => g.categoria === c.id).reduce((s, g) => s + g.monto, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <Encabezado
        titulo="Gastos"
        descripcion="Todo lo que sale: alquiler, mercadería, envíos, publicidad. Se resta de las ventas en el Balance."
      />
      <SelectorMes mes={mes} ruta="/admin/gastos" />

      <div className="grid items-start gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Tarjeta titulo="Cargar gasto">
            <FormularioGasto hoy={diaAR()} />
          </Tarjeta>
          <Tarjeta titulo={`Total de ${nombreMes(mes)}`}>
            <p className="text-[28px] leading-none font-bold">{precio(total)}</p>
            {porCategoria.length > 0 && (
              <ul className="mt-5 flex flex-col gap-3 text-sm">
                {porCategoria.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1.5">
                    <span className="flex justify-between gap-3">
                      <span>{c.nombre}</span>
                      <span className="font-mono tabular-nums">{precio(c.total)}</span>
                    </span>
                    <Barra valor={c.total} maximo={porCategoria[0].total} color={COLOR_EGRESOS} />
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <Tarjeta titulo={`Gastos de ${nombreMes(mes)}`} sinRelleno>
          {gastos.length === 0 ? (
            <div className="p-5">
              <Vacio>No hay gastos cargados en {nombreMes(mes)}.</Vacio>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="font-mono text-[11px] tracking-[.1em] text-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-normal">Fecha</th>
                    <th className="px-5 py-3 font-normal">Categoría</th>
                    <th className="px-5 py-3 font-normal">Descripción</th>
                    <th className="px-5 py-3 text-right font-normal">Monto</th>
                    <th className="px-5 py-3">
                      <span className="sr-only">Borrar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {gastos.map((g) => (
                    <tr key={g.id} className="hover:bg-panel-2">
                      <td className="px-5 py-2.5 font-mono text-xs">{fechaDia(g.fecha)}</td>
                      <td className="px-5 py-2.5">{nombreDe(CATEGORIAS_GASTO, g.categoria)}</td>
                      <td className="px-5 py-2.5 text-muted">{g.descripcion || "—"}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold tabular-nums">{precio(g.monto)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <BotonConfirmar
                          accion={eliminarGastoAccion.bind(null, g.id)}
                          pregunta={`¿Borrar el gasto de ${precio(g.monto)}${g.descripcion ? ` (${g.descripcion})` : ""}?`}
                          className="cursor-pointer p-1 text-muted hover:text-red"
                        >
                          <Trash2 size={15} aria-label="Borrar gasto" />
                        </BotonConfirmar>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
