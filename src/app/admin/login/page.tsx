import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { haySesion } from "@/lib/auth";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Ingresar al panel", robots: { index: false } };

export default async function Login() {
  if (await haySesion()) redirect("/admin");
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-gutter">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(200px,34vw,440px)] leading-none whitespace-nowrap opacity-20 select-none text-outline-green"
      >
        悪魔
      </div>
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 border border-line bg-ink p-8">
        <Image src="/akuma-logo.png" alt="Akuma Street" width={96} height={96} className="size-24 rounded-full" />
        <div className="text-center">
          <h1 className="font-display text-2xl leading-none">Panel</h1>
          <p className="mt-2 font-mono text-xs tracking-[.12em] text-muted">VENTAS · STOCK · BALANCE</p>
        </div>
        <FormularioLogin />
      </div>
    </main>
  );
}
