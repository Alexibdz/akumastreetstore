import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { COOKIE_SESION, DURACION_SESION_S, crearToken, tokenValido } from "./sesion-token";

/**
 * Corta si no hay sesión válida (manda al login). Se llama al principio de cada página y acción del panel:
 * el proxy solo hace un chequeo rápido y los layouts no se vuelven a ejecutar al navegar.
 */
export const verificarSesion = cache(async () => {
  if (!(await haySesion())) redirect("/admin/login");
});

export async function haySesion() {
  return tokenValido((await cookies()).get(COOKIE_SESION)?.value);
}

export async function abrirSesion() {
  (await cookies()).set(COOKIE_SESION, crearToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE_SESION);
}
