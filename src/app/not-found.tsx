import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden px-gutter text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(200px,34vw,440px)] leading-none whitespace-nowrap opacity-30 select-none text-outline-green"
      >
        迷子
      </div>
      <p className="relative font-mono text-sm tracking-[.2em] text-muted">ERROR 404</p>
      <h1 className="relative font-display text-[clamp(32px,5vw,56px)] leading-none">
        ESTA PÁGINA <span className="text-red">SE PERDIÓ</span>
      </h1>
      <Link href="/catalogo" className="relative bg-red px-8 py-[18px] text-base font-black tracking-[.05em] text-white hover:brightness-110">
        VOLVER AL CATÁLOGO
      </Link>
    </main>
  );
}
