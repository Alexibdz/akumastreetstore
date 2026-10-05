import type { Metadata } from "next";
import { MenuPanel } from "@/components/admin/MenuPanel";
import { verificarSesion } from "@/lib/auth";
import { salir } from "../acciones-sesion";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Akuma" }, robots: { index: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  await verificarSesion();
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <MenuPanel salir={salir} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-[clamp(16px,3vw,40px)] py-8">{children}</main>
    </div>
  );
}
