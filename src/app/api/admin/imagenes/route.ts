import { haySesion } from "@/lib/auth";
import { ErrorNegocio } from "@/lib/db/errores";
import { guardarImagen } from "@/lib/imagenes";

// Subida de fotos desde el panel (productos y posts de Instagram). Una foto por request.
export async function POST(req: Request) {
  if (!(await haySesion())) return Response.json({ error: "La sesión venció: volvé a entrar." }, { status: 401 });
  const archivo = (await req.formData()).get("archivo");
  if (!(archivo instanceof File)) return Response.json({ error: "No llegó ningún archivo." }, { status: 400 });
  try {
    return Response.json({ url: await guardarImagen(archivo) });
  } catch (e) {
    if (e instanceof ErrorNegocio) return Response.json({ error: e.message }, { status: 400 });
    console.error(e);
    return Response.json({ error: "No se pudo guardar la imagen." }, { status: 500 });
  }
}
