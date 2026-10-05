import { leerImagen } from "@/lib/imagenes";

// Sirve las fotos subidas desde el panel. Los nombres son únicos, así que se cachean para siempre.
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[archivo]">) {
  const { archivo } = await ctx.params;
  const datos = await leerImagen(archivo);
  if (!datos) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(datos), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
