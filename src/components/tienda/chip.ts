/** Chip de filtro: activo relleno (verde con texto negro), inactivo con borde #333. */
export function claseChip(activo: boolean, { tono = "verde", chico = false }: { tono?: "verde" | "rojo"; chico?: boolean } = {}) {
  const tamano = chico ? "px-3 py-1.5 text-[13px]" : "px-[18px] py-2.5 text-[15px]";
  if (activo) {
    const color = tono === "rojo" ? "border-red bg-red text-white" : "border-green bg-green text-ink";
    return `border-2 font-black ${color} ${tamano}`;
  }
  return `border-2 border-line-2 font-bold transition-colors hover:border-bone ${tono === "rojo" ? "text-red" : "text-bone"} ${tamano}`;
}
