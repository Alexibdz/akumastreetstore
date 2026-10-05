import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { diaAR, inicioDiaISO, mesAR, sumarDias, sumarMeses } from "@/lib/formato";
import { slugify } from "@/lib/texto";

// Datos de ejemplo que se cargan la primera vez que se crea la base.
// Para arrancar de cero: Configuración > "Borrar ventas, gastos y movimientos", o `npm run db:reset`.

type ProductoSemilla = {
  nombre: string;
  categoria: string;
  serie: string;
  precio: number;
  anterior?: number;
  costo: number;
  etiqueta?: "NUEVO" | "PREVENTA";
  destacado?: boolean;
  stock: number | Record<string, number>; // stock actual (por talle si es ropa)
  descripcion: string;
};

const PRODUCTOS: ProductoSemilla[] = [
  { nombre: "Manga Jujutsu Kaisen Tomo 1", categoria: "mangas", serie: "Jujutsu Kaisen", precio: 16500, costo: 10500, stock: 12, etiqueta: "NUEVO", descripcion: "Edición en español, tapa blanda con sobrecubierta. 192 páginas." },
  { nombre: "Manga Chainsaw Man Tomo 1", categoria: "mangas", serie: "Chainsaw Man", precio: 16500, costo: 10500, stock: 8, descripcion: "Edición en español, tapa blanda. 192 páginas." },
  { nombre: "Box Set One Piece Tomos 1–5", categoria: "mangas", serie: "One Piece", precio: 65600, anterior: 82000, costo: 52000, stock: 3, destacado: true, descripcion: "Los primeros cinco tomos en caja coleccionable." },
  { nombre: "Manga Demon Slayer Tomo 1 Edición Coleccionista", categoria: "mangas", serie: "Demon Slayer", precio: 18500, costo: 12000, stock: 0, etiqueta: "PREVENTA", descripcion: "Sobrecubierta especial y lámina de regalo con tu reserva. Ingreso estimado: el mes que viene." },
  { nombre: "Figura Luffy Gear 5 PVC 18 cm", categoria: "figuras", serie: "One Piece", precio: 74900, costo: 46000, stock: 4, destacado: true, descripcion: "PVC pintado a mano, base incluida. Viene en caja original." },
  { nombre: "Figura Tanjiro Escala 1/8", categoria: "figuras", serie: "Demon Slayer", precio: 129000, costo: 82000, stock: 2, etiqueta: "NUEVO", descripcion: "Escala 1/8 con base temática y efecto de agua. Stock limitado." },
  { nombre: "Figura Rengoku Escala 1/7", categoria: "figuras", serie: "Demon Slayer", precio: 141750, anterior: 189000, costo: 120000, stock: 1, descripcion: "Escala 1/7, PVC y ABS, efecto de fuego en la base." },
  { nombre: "Figura Goku Super Saiyan 20 cm", categoria: "figuras", serie: "Dragon Ball", precio: 89900, costo: 55000, stock: 3, etiqueta: "NUEVO", destacado: true, descripcion: "20 cm de altura, PVC pintado. Incluye cabeza intercambiable." },
  { nombre: "Buzo Oversize Dominio Expandido", categoria: "ropa", serie: "Jujutsu Kaisen", precio: 54900, costo: 29000, stock: { S: 2, M: 4, L: 3, XL: 1 }, destacado: true, descripcion: "Algodón 400 g, estampa frente y espalda. Calce oversize." },
  { nombre: "Remera Estampa Tripulación", categoria: "ropa", serie: "One Piece", precio: 29900, costo: 13500, stock: { S: 3, M: 5, L: 4, XL: 2 }, descripcion: "Algodón peinado 24/1, estampa en serigrafía." },
  { nombre: "Buzo Oversize Akuma Negro", categoria: "ropa", serie: "Akuma Street", precio: 43900, anterior: 54900, costo: 27000, stock: { M: 2, L: 3, XL: 2 }, descripcion: "El buzo de la casa: algodón 400 g, kanji bordado en el pecho." },
  { nombre: "Remera Street Kanji Rojo", categoria: "ropa", serie: "Akuma Street", precio: 29900, costo: 13500, stock: { S: 4, M: 6, L: 5, XL: 3, XXL: 1 }, etiqueta: "NUEVO", descripcion: "Remera oversize con kanji 悪魔 en rojo." },
  { nombre: "Hot Wheels Nissan Skyline GT-R (R34)", categoria: "hot-wheels", serie: "Fast & Furious", precio: 9900, costo: 5200, stock: 6, descripcion: "Escala 1:64, blíster original." },
  { nombre: "Hot Wheels Toyota Supra", categoria: "hot-wheels", serie: "Fast & Furious", precio: 9900, costo: 5200, stock: 5, descripcion: "Escala 1:64, blíster original." },
  { nombre: "Hot Wheels Premium Honda Civic Type R", categoria: "hot-wheels", serie: "Car Culture", precio: 14900, costo: 8500, stock: 2, descripcion: "Línea Premium: carrocería de metal y ruedas de goma." },
  { nombre: "Póster A3 Ninja de la Hoja", categoria: "posters", serie: "Naruto", precio: 9900, costo: 2500, stock: 20, descripcion: "Impresión A3 en papel ilustración 250 g." },
  { nombre: "Póster A3 Dominio Expandido", categoria: "posters", serie: "Jujutsu Kaisen", precio: 9900, costo: 2500, stock: 15, descripcion: "Impresión A3 en papel ilustración 250 g." },
  { nombre: "Llavero Acrílico Nichirin", categoria: "accesorios", serie: "Demon Slayer", precio: 6900, costo: 2200, stock: 25, descripcion: "Acrílico de 3 mm con impresión doble faz." },
  { nombre: "Vincha Bordada Aldea de la Hoja", categoria: "accesorios", serie: "Naruto", precio: 12900, costo: 5800, stock: 7, descripcion: "Placa metálica grabada sobre tela azul." },
  { nombre: "Gorra Bordada Cápsula", categoria: "accesorios", serie: "Dragon Ball", precio: 24900, costo: 11000, stock: 0, descripcion: "Gorra trucker con logo bordado." },
];

const CLIENTES = ["", "", "", "Juli", "Mati", "Sofi", "Tomás", "Agus", "Cami", "Nico", "Lu", "Fran", "Valen", "Santi"];

/** PRNG con semilla fija: los datos de ejemplo salen siempre iguales. */
function mulberry32(semilla: number) {
  return () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cargarSemilla(db: Database.Database) {
  const rnd = mulberry32(7);
  const ponderado = <T,>(opciones: [T, number][]) => {
    let r = rnd() * opciones.reduce((s, [, p]) => s + p, 0);
    for (const [valor, peso] of opciones) if ((r -= peso) < 0) return valor;
    return opciones[0][0];
  };

  const hoy = diaAR();
  const ahora = Date.now();
  const inicio = sumarDias(hoy, -62);
  const inicioISO = inicioDiaISO(inicio);

  db.transaction(() => {
    // 1. Productos y talles
    const insProducto = db.prepare(
      `INSERT INTO productos (slug, nombre, categoria, serie, descripcion, precio, precio_anterior, costo, etiqueta, destacado, visible, imagenes, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    );
    const insVariante = db.prepare("INSERT INTO variantes (producto_id, nombre, stock, orden) VALUES (?, ?, 0, ?)");

    type V = { id: number; productoId: number; descripcion: string; final: number; vendidas: number; p: ProductoSemilla };
    const variantes: V[] = [];
    for (const p of PRODUCTOS) {
      const slug = slugify(p.nombre);
      // Foto de ejemplo de public/demo, si está
      const foto = fs.existsSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "demo", `${slug}.webp`));
      const { lastInsertRowid } = insProducto.run(
        slug, p.nombre, p.categoria, p.serie, p.descripcion, p.precio, p.anterior ?? null, p.costo,
        p.etiqueta ?? null, p.destacado ? 1 : 0, JSON.stringify(foto ? [`/demo/${slug}.webp`] : []), inicioISO, inicioISO,
      );
      const productoId = Number(lastInsertRowid);
      const talles = typeof p.stock === "number" ? { "": p.stock } : p.stock;
      Object.entries(talles).forEach(([talle, final], orden) => {
        const id = Number(insVariante.run(productoId, talle, orden).lastInsertRowid);
        variantes.push({ id, productoId, descripcion: talle ? `${p.nombre} (${talle})` : p.nombre, final, vendidas: 0, p });
      });
    }

    // 2. Ventas simuladas de los últimos 60 días (sin preventas)
    const vendibles = variantes.filter((v) => v.p.etiqueta !== "PREVENTA");
    type VentaSim = { fecha: string; items: { v: V; cantidad: number }[]; descuento: number; medio: string; canal: string; cliente: string };
    const ventas: VentaSim[] = [];
    for (let d = 59; d >= 0; d--) {
      const dia = sumarDias(hoy, -d);
      const cantidadVentas = ponderado([[0, 30], [1, 42], [2, 22], [3, 6]]);
      for (let k = 0; k < cantidadVentas; k++) {
        const hora = String(10 + Math.floor(rnd() * 10)).padStart(2, "0");
        const minuto = String(Math.floor(rnd() * 60)).padStart(2, "0");
        const fecha = new Date(`${dia}T${hora}:${minuto}:00-03:00`);
        if (fecha.getTime() > ahora) continue;
        const items: VentaSim["items"] = [];
        const n = ponderado([[1, 70], [2, 25], [3, 5]]);
        for (let i = 0; i < n; i++) {
          const v = vendibles[Math.floor(rnd() * vendibles.length)];
          if (items.some((x) => x.v === v)) continue;
          items.push({ v, cantidad: v.p.precio < 15000 && rnd() < 0.25 ? 2 : 1 });
        }
        const subtotal = items.reduce((s, x) => s + x.v.p.precio * x.cantidad, 0);
        ventas.push({
          fecha: fecha.toISOString(),
          items,
          descuento: rnd() < 0.12 ? Math.round((subtotal * 0.1) / 100) * 100 : 0,
          medio: ponderado([["efectivo", 30], ["transferencia", 30], ["mercadopago", 25], ["debito", 10], ["credito", 5]]),
          canal: ponderado([["local", 45], ["whatsapp", 35], ["instagram", 20]]),
          cliente: CLIENTES[Math.floor(rnd() * CLIENTES.length)],
        });
      }
    }
    ventas.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Una venta anulada al día siguiente, para ver cómo queda (solo de talles con stock de sobra)
    const anulada = ventas.find((v, i) => i > 5 && v.items.every((x) => x.v.final >= 2));

    // 3. Stock inicial = stock actual + lo vendido (las anuladas devuelven su stock)
    for (const venta of ventas) {
      if (venta === anulada) continue;
      for (const x of venta.items) x.v.vendidas += x.cantidad;
    }
    const insMov = db.prepare(
      `INSERT INTO movimientos_stock (fecha, variante_id, tipo, cantidad, stock_resultante, costo_unitario, nota, venta_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const stock = new Map<number, number>();
    for (const v of variantes) {
      const inicial = v.final + v.vendidas;
      stock.set(v.id, inicial);
      if (inicial > 0) insMov.run(inicioISO, v.id, "inicial", inicial, inicial, v.p.costo, "", null);
    }

    // 4. Grabar las ventas en orden, con sus movimientos
    const insVenta = db.prepare(
      `INSERT INTO ventas (fecha, cliente, canal, medio_pago, subtotal, descuento, total, notas, anulada_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', ?)`,
    );
    const insItem = db.prepare(
      `INSERT INTO venta_items (venta_id, producto_id, variante_id, descripcion, cantidad, precio_unitario, costo_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const venta of ventas) {
      const subtotal = venta.items.reduce((s, x) => s + x.v.p.precio * x.cantidad, 0);
      const anuladaEn = venta === anulada ? new Date(Date.parse(venta.fecha) + 86_400_000).toISOString() : null;
      const ventaId = Number(
        insVenta.run(venta.fecha, venta.cliente, venta.canal, venta.medio, subtotal, venta.descuento, subtotal - venta.descuento, anuladaEn)
          .lastInsertRowid,
      );
      for (const x of venta.items) {
        insItem.run(ventaId, x.v.productoId, x.v.id, x.v.descripcion, x.cantidad, x.v.p.precio, x.v.p.costo);
        const s = stock.get(x.v.id)! - x.cantidad;
        stock.set(x.v.id, s);
        insMov.run(venta.fecha, x.v.id, "venta", -x.cantidad, s, null, "", ventaId);
      }
      if (anuladaEn) {
        for (const x of venta.items) {
          const s = stock.get(x.v.id)! + x.cantidad;
          stock.set(x.v.id, s);
          insMov.run(anuladaEn, x.v.id, "anulacion", x.cantidad, s, null, "", ventaId);
        }
      }
    }
    const actualizarStock = db.prepare("UPDATE variantes SET stock = ? WHERE id = ?");
    for (const [id, s] of stock) actualizarStock.run(s, id);

    // 5. Gastos de los últimos meses (solo hasta hoy)
    const insGasto = db.prepare("INSERT INTO gastos (fecha, categoria, descripcion, monto, creado_en) VALUES (?, ?, ?, ?, ?)");
    for (let m = -2; m <= 0; m++) {
      const mes = sumarMeses(mesAR(), m);
      const gastos: [string, string, string, number][] = [
        ["05", "alquiler", "Alquiler del local", 380000],
        ["08", "mercaderia", "Reposición de figuras y mangas", 280000 + Math.round(rnd() * 14) * 10000],
        ["12", "servicios", "Luz e internet", 48000 + Math.round(rnd() * 12) * 1000],
        ["15", "publicidad", "Publicidad en Instagram", 35000],
        ["20", "envios", "Envíos del mes", 15000 + Math.round(rnd() * 10) * 1000],
      ];
      for (const [dia, categoria, descripcion, monto] of gastos) {
        const fecha = `${mes}-${dia}`;
        if (fecha >= inicio && fecha <= hoy) insGasto.run(fecha, categoria, descripcion, monto, inicioISO);
      }
    }
  })();
}
