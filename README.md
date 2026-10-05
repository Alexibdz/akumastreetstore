# Akuma Street

Catálogo web de la tienda (anime y streetwear) y panel para administrar ventas, stock, gastos y balance.
La tienda es un expositor: no tiene carrito; cada producto se consulta por WhatsApp.

Next.js 16 + React 19 + TypeScript + Tailwind 4, íconos de Lucide y base local SQLite (lista para pasar a Supabase).

```bash
npm install
npm run dev
```

- Tienda: http://localhost:3000
- Panel: http://localhost:3000/admin. La contraseña es `ADMIN_PASSWORD` en `.env.local`.

## La tienda

| Página | Qué tiene |
|---|---|
| `/` | Hero, categorías, «Buscar por serie» y ofertas |
| `/catalogo?cat=ropa` | Grilla con filtros por categoría, serie y ofertas |
| `/producto/<slug>` | Galería, precio, talles, estado de stock y botón «CONSULTAR POR WHATSAPP» |
| `/como-comprar` | Los pasos para comprar |

El botón CONSULTAR abre `https://wa.me/<número>?text=Hola! Quiero consultar por: <nombre> (<serie>)`. Si el producto tiene talles, suma el talle elegido.

## El panel

| Sección | Para qué sirve |
|---|---|
| **Inicio** | Lo vendido en el mes y hoy, el balance, ventas de los últimos 30 días, stock bajo, últimas ventas y más vendidos |
| **Nueva venta** | Buscás el producto, armás el ticket (podés cambiar el precio o hacer descuento), elegís medio de pago y canal. Descuenta el stock solo. |
| **Ventas** | Listado por mes. Desde el detalle se puede **anular** una venta: devuelve el stock y deja de contar. |
| **Productos** | Alta, edición y baja: fotos (se achican solas), precio, precio anterior (oferta), costo, serie, etiqueta (NUEVO / PREVENTA), destacado, visible y **talles**, cada uno con su stock |
| **Stock** | Stock por producto y talle, valorizado. **Ingresar** mercadería (opcionalmente la anota como gasto) y **Ajustar** por conteo, rotura o pérdida. Todo queda en el **Historial**. |
| **Gastos** | Alquiler, mercadería, envíos, publicidad… por mes |
| **Balance** | Ingresos (ventas) menos egresos (gastos), ganancia bruta y margen, gráfico de 6 meses y desglose por medio de pago, canal y categoría |
| **Configuración** | WhatsApp, usuario de Instagram (para los links del menú y el pie), mostrar u ocultar precios y aviso de stock bajo |

**Reglas que conviene saber:**
- **Preventas:** los productos con etiqueta PREVENTA se pueden vender sin stock. El stock queda en negativo y representa reservas.
- **Productos con ventas:** no se pueden borrar, se ocultan.
- **Talles:** un talle solo se puede quitar si tiene stock 0. Así no se pierde la cuenta.

## Datos

- **Base:** `data/akuma.db` (SQLite) y las fotos en `data/uploads/`. La carpeta `data/` no se sube a git.
- **Demo:** `demo/akuma.db` es una copia de la base que sí se sube. Es con la que arranca la web publicada (ver abajo). Para actualizarla con lo que tenés en tu base local: `npm run db:demo` y subir el cambio.
- **Datos de ejemplo:** la primera vez se carga con 20 productos de ejemplo, 60 días de ventas y gastos simulados.
- **Fotos de ejemplo:** están en `public/demo/` (Creative Commons, con autores en `public/demo/CREDITOS.md`). Reemplazalas por fotos propias desde el panel.
- **Empezar de cero:** **Configuración → Borrar ventas, gastos y movimientos** deja los productos. Si querés volver a la base de ejemplo completa, usá `npm run db:reset` con el servidor apagado.
- **Categorías:** están en `src/lib/catalogo.ts`. Lo mismo los medios de pago, canales y categorías de gasto.

## Pasar a Supabase

Todo el acceso a datos está en `src/lib/db/*`: son funciones `async`, así que el resto de la app no cambia. Para migrar:
1. Crear las tablas en Postgres. Son las mismas de `src/lib/db/conexion.ts`; hay que cambiar `INTEGER PRIMARY KEY AUTOINCREMENT` por `bigint generated always as identity` y las fechas a `timestamptz`.
2. Reescribir los módulos de `src/lib/db/` con `@supabase/supabase-js`. Las ventas, anulaciones e ingresos de stock conviene hacerlos como funciones RPC, para que sigan siendo transacciones.
3. Fotos: cambiar `src/lib/imagenes.ts` para que suba a Supabase Storage.
4. Login (opcional): reemplazar `src/lib/auth.ts` por Supabase Auth.

**Para publicar la web** de verdad hace falta un servidor con disco que no se borre, o pasar antes a Supabase.

**En Vercel funciona como demo.** El disco es de solo lectura salvo `/tmp`, así que la app copia `demo/akuma.db` a `/tmp` y trabaja sobre esa copia. Se puede navegar la tienda y usar el panel, pero lo que cambies (ventas, productos, fotos) se pierde cuando Vercel reinicia el servidor, y cada servidor tiene su propia copia. En Vercel hay que cargar las variables `ADMIN_PASSWORD`, `ADMIN_SECRET` y `SITE_URL` en *Settings → Environment Variables*.

## Variables (`.env.local`)

| Variable | Para qué |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del panel |
| `ADMIN_SECRET` | Firma la sesión. Si la cambiás, se cierran las sesiones abiertas. |
| `SITE_URL` | URL pública. La usan las vistas previas al compartir un producto. |
| `DATABASE_PATH`, `UPLOADS_PATH` | Opcionales: otra ubicación para la base y las fotos |
