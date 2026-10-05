import { Pie } from "@/components/tienda/Pie";
import { obtenerConfiguracion } from "@/lib/db/configuracion";

export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const config = await obtenerConfiguracion();
  return (
    <>
      {children}
      <Pie config={config} />
    </>
  );
}
