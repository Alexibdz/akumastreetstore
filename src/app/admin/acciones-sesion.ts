"use server";

import { redirect } from "next/navigation";
import { abrirSesion, cerrarSesion } from "@/lib/auth";
import { passwordCorrecta } from "@/lib/sesion-token";

export async function iniciarSesion(_previo: { error: string } | null, formData: FormData): Promise<{ error: string } | null> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: "Falta configurar ADMIN_PASSWORD en el archivo .env.local." };
  }
  if (!passwordCorrecta(String(formData.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 700)); // frena los intentos a ciegas
    return { error: "Contraseña incorrecta." };
  }
  await abrirSesion();
  redirect("/admin");
}

export async function salir() {
  await cerrarSesion();
  redirect("/admin/login");
}
