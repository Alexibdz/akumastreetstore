"use client";

import { Boxes, ChartColumn, ExternalLink, LayoutDashboard, LogOut, Menu, Package, Plus, Receipt, Settings, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const SECCIONES = [
  { href: "/admin", texto: "Inicio", icono: LayoutDashboard },
  { href: "/admin/ventas", texto: "Ventas", icono: Receipt },
  { href: "/admin/productos", texto: "Productos", icono: Package },
  { href: "/admin/stock", texto: "Stock", icono: Boxes },
  { href: "/admin/gastos", texto: "Gastos", icono: Wallet },
  { href: "/admin/balance", texto: "Balance", icono: ChartColumn },
  { href: "/admin/configuracion", texto: "Configuración", icono: Settings },
];

function activa(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/ventas") return pathname.startsWith("/admin/ventas") && pathname !== "/admin/ventas/nueva";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Menú lateral del panel (en celular, barra arriba con menú desplegable). */
export function MenuPanel({ salir }: { salir: () => Promise<void> }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  const contenido = (
    <>
      <Link
        href="/admin/ventas/nueva"
        onClick={cerrar}
        className={`mx-4 mb-4 flex items-center justify-center gap-2 py-3 text-sm font-black tracking-[.05em] ${
          pathname === "/admin/ventas/nueva" ? "bg-bone text-ink" : "bg-red text-white hover:brightness-110"
        }`}
      >
        <Plus size={18} strokeWidth={3} aria-hidden /> NUEVA VENTA
      </Link>
      <nav aria-label="Panel" className="flex flex-col">
        {SECCIONES.map(({ href, texto, icono: Icono }) => {
          const esActiva = activa(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={cerrar}
              aria-current={esActiva ? "page" : undefined}
              className={`flex items-center gap-3 border-l-4 px-5 py-2.5 text-[15px] font-bold ${
                esActiva ? "border-green bg-panel-2 text-green" : "border-transparent text-bone/80 hover:bg-panel-2 hover:text-bone"
              }`}
            >
              <Icono size={18} aria-hidden />
              {texto}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col border-t border-line pt-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-5 py-2.5 text-sm text-muted hover:text-bone">
          <ExternalLink size={16} aria-hidden /> Ver la tienda
        </Link>
        <form action={salir}>
          <button type="submit" className="flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-sm text-muted hover:text-bone">
            <LogOut size={16} aria-hidden /> Salir
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-line bg-ink py-5 lg:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-3 px-5">
          <Image src="/akuma-logo.png" alt="" width={40} height={40} className="size-10 rounded-full" />
          <span className="font-display text-[15px] leading-tight">
            AKUMA
            <br />
            <span className="font-mono text-[11px] tracking-[.2em] text-muted">PANEL</span>
          </span>
        </Link>
        {contenido}
      </aside>

      {/* Celular y tablet */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ink px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/akuma-logo.png" alt="" width={34} height={34} className="size-[34px] rounded-full" />
          <span className="font-mono text-xs tracking-[.2em] text-muted">PANEL</span>
        </Link>
        <button type="button" aria-label={abierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={abierto} onClick={() => setAbierto(!abierto)} className="p-1">
          {abierto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
      {abierto && (
        <div className="fixed inset-x-0 top-[61px] bottom-0 z-30 flex flex-col overflow-y-auto bg-ink py-5 lg:hidden">{contenido}</div>
      )}
    </>
  );
}
