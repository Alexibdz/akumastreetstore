/** Minúsculas y sin acentos, para buscar "poster" y encontrar "Póster". */
export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** "Figura PVC 18 cm — One Piece" -> "figura-pvc-18-cm-one-piece" */
export const slugify = (s: string) =>
  normalizar(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
