import type { CategoriaSlug, Etiqueta, TipoMovimiento } from "./catalogo";

/** Talle o variante. Los productos sin talles tienen una sola variante con nombre "". */
export type Variante = { id: number; nombre: string; stock: number };

/** Lo que ve la tienda pública (sin costo). */
export type ProductoPublico = {
  id: number;
  slug: string;
  nombre: string;
  categoria: CategoriaSlug;
  serie: string;
  descripcion: string;
  precio: number;
  precioAnterior: number | null;
  etiqueta: Etiqueta | null;
  destacado: boolean;
  imagenes: string[];
  variantes: Variante[];
  stock: number; // suma de las variantes
};

export type Producto = ProductoPublico & {
  costo: number | null;
  visible: boolean;
  creadoEn: string;
  actualizadoEn: string;
};

export type VentaItem = {
  id: number;
  productoId: number | null;
  varianteId: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number | null;
};

export type Venta = {
  id: number;
  fecha: string;
  cliente: string;
  canal: string;
  medioPago: string;
  subtotal: number;
  descuento: number;
  total: number;
  notas: string;
  anuladaEn: string | null;
  items: VentaItem[];
};

export type Gasto = {
  id: number;
  fecha: string; // YYYY-MM-DD
  categoria: string;
  descripcion: string;
  monto: number;
};

export type FilaStock = {
  varianteId: number;
  productoId: number;
  producto: string;
  slug: string;
  talle: string;
  categoria: CategoriaSlug;
  serie: string;
  stock: number;
  costo: number | null;
  precio: number;
  preventa: boolean;
  visible: boolean;
};

export type Movimiento = {
  id: number;
  fecha: string;
  varianteId: number;
  producto: string;
  productoId: number;
  talle: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockResultante: number;
  costoUnitario: number | null;
  nota: string;
  ventaId: number | null;
};

export type Configuracion = {
  whatsapp: string; // solo dígitos, con código de país: 5491112345678
  instagram: string; // usuario sin @
  mostrarPrecios: boolean;
  umbralStockBajo: number;
};
