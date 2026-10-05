/** https://wa.me/<numero>?text=Hola! Quiero consultar por: <nombre> (<serie>) */
export function linkConsulta(numero: string, nombre: string, serie: string, talle?: string) {
  let texto = `Hola! Quiero consultar por: ${nombre}${serie ? ` (${serie})` : ""}`;
  if (talle) texto += ` - Talle ${talle}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export const linkGeneral = (numero: string) =>
  `https://wa.me/${numero}?text=${encodeURIComponent("Hola! Quiero hacer una consulta")}`;

export const linkInstagram = (usuario: string) => `https://instagram.com/${usuario}`;
