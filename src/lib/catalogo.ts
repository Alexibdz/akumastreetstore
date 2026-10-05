// Listas fijas del negocio. Para agregar o renombrar una categoría, se cambia acá.

export const CATEGORIAS = [
  { slug: "mangas", nombre: "Mangas", placeholder: "tomo" },
  { slug: "figuras", nombre: "Figuras", placeholder: "figura" },
  { slug: "ropa", nombre: "Ropa", placeholder: "prenda" },
  { slug: "hot-wheels", nombre: "Hot Wheels", placeholder: "auto" },
  { slug: "posters", nombre: "Posters", placeholder: "póster" },
  { slug: "accesorios", nombre: "Accesorios", placeholder: "accesorio" },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS)[number]["slug"];

export const esCategoria = (valor: unknown): valor is CategoriaSlug => CATEGORIAS.some((c) => c.slug === valor);

export const categoria = (slug: string) => CATEGORIAS.find((c) => c.slug === slug) ?? CATEGORIAS[0];

export const ETIQUETAS = ["NUEVO", "PREVENTA"] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

export const MEDIOS_PAGO = [
  { id: "efectivo", nombre: "Efectivo" },
  { id: "transferencia", nombre: "Transferencia" },
  { id: "mercadopago", nombre: "Mercado Pago" },
  { id: "debito", nombre: "Débito" },
  { id: "credito", nombre: "Crédito" },
  { id: "otro", nombre: "Otro" },
] as const;

export const CANALES = [
  { id: "local", nombre: "Local" },
  { id: "whatsapp", nombre: "WhatsApp" },
  { id: "instagram", nombre: "Instagram" },
  { id: "otro", nombre: "Otro" },
] as const;

export const CATEGORIAS_GASTO = [
  { id: "mercaderia", nombre: "Mercadería" },
  { id: "alquiler", nombre: "Alquiler" },
  { id: "servicios", nombre: "Servicios" },
  { id: "sueldos", nombre: "Sueldos" },
  { id: "envios", nombre: "Envíos" },
  { id: "publicidad", nombre: "Publicidad" },
  { id: "impuestos", nombre: "Impuestos" },
  { id: "otros", nombre: "Otros" },
] as const;

export const MOTIVOS_AJUSTE = ["Conteo", "Rotura", "Pérdida o robo", "Regalo o canje", "Otro"] as const;

export const TIPOS_MOVIMIENTO = {
  inicial: "Stock inicial",
  ingreso: "Ingreso",
  venta: "Venta",
  anulacion: "Venta anulada",
  ajuste: "Ajuste",
} as const;

export type TipoMovimiento = keyof typeof TIPOS_MOVIMIENTO;

export const nombreDe = (lista: readonly { id: string; nombre: string }[], id: string) =>
  lista.find((x) => x.id === id)?.nombre ?? id;
