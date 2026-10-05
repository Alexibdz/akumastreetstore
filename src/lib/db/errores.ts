/** Error con un mensaje para mostrarle al usuario (stock insuficiente, datos inválidos, etc.). */
export class ErrorNegocio extends Error {}

export const mensajeDeError = (e: unknown) =>
  e instanceof ErrorNegocio ? e.message : "Algo salió mal. Probá de nuevo y, si sigue, revisá la consola del servidor.";
