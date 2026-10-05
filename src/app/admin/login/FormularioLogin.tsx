"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { claseBoton } from "@/components/admin/ui";
import { iniciarSesion } from "../acciones-sesion";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, null);
  return (
    <form action={accion} className="flex w-full flex-col gap-3">
      <label htmlFor="password" className="font-mono text-[11px] tracking-[.12em] text-muted">
        CONTRASEÑA
      </label>
      <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="campo" />
      {estado?.error && (
        <p role="alert" className="text-sm text-red">
          {estado.error}
        </p>
      )}
      <button type="submit" disabled={enviando} className={`${claseBoton()} mt-2 py-3`}>
        <Lock size={16} aria-hidden /> {enviando ? "ENTRANDO…" : "ENTRAR"}
      </button>
    </form>
  );
}
