// Formatos y fechas. Todo se calcula en hora de Argentina (UTC-3, sin horario de verano).

export const ZONA = "America/Argentina/Buenos_Aires";
const OFFSET = "-03:00";

/** $54.900 (y −$310.300 si es negativo) */
export const precio = (n: number) => (n < 0 ? "−" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("es-AR");

/** "1 venta", "3 ventas" */
export const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

/** 1.234 */
export const numero = (n: number) => Math.round(n).toLocaleString("es-AR");

/** Para ejes: $250k, $1,5M */
export function compacto(n: number) {
  const f = (x: number) => x.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1e6) return `$${f(n / 1e6)}M`;
  if (Math.abs(n) >= 1e3) return `$${f(n / 1e3)}k`;
  return `$${Math.round(n)}`;
}

export const porcentaje = (n: number) => `${Math.round(n)}%`;

/** Descuento redondeado de una oferta: -25% */
export const descuento = (precioActual: number, precioAnterior: number) =>
  `-${Math.round((1 - precioActual / precioAnterior) * 100)}%`;

/** "2026-10-05" de un instante, en hora argentina */
export const diaAR = (fecha: Date | string = new Date()) => new Date(fecha).toLocaleDateString("en-CA", { timeZone: ZONA });

/** "2026-10" */
export const mesAR = (fecha: Date | string = new Date()) => diaAR(fecha).slice(0, 7);

/** Instante UTC (ISO) del comienzo de un día argentino */
export const inicioDiaISO = (dia: string) => new Date(`${dia}T00:00:00${OFFSET}`).toISOString();

export function sumarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function sumarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Rango [desde, hasta) de un mes "2026-10": instantes ISO para ventas y días para gastos */
export function rangoMes(mes: string) {
  const siguiente = sumarMeses(mes, 1);
  return {
    desdeISO: inicioDiaISO(`${mes}-01`),
    hastaISO: inicioDiaISO(`${siguiente}-01`),
    desdeDia: `${mes}-01`,
    hastaDia: `${siguiente}-01`,
  };
}

export const esMes = (valor: unknown): valor is string => typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
export const esDia = (valor: unknown): valor is string =>
  typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "octubre 2026" */
export const nombreMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

/** "oct" */
export const mesCorto = (mes: string) => MESES[Number(mes.slice(5, 7)) - 1].slice(0, 3);

/** 05/10/2026 14:32 */
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** 05/10/2026 (de un día "2026-10-05") */
export const fechaDia = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
