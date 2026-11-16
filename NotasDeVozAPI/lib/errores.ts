export type DetalleError = { campo: string; mensaje: string };

/** Error previsto de la API: su mensaje sí puede mostrarse al cliente. */
export class ErrorApi extends Error {
  readonly status: number;
  readonly detalles: DetalleError[] | undefined;

  constructor(status: number, mensaje: string, detalles?: DetalleError[]) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.detalles = detalles;
  }
}

/** Convierte cualquier error en la respuesta única `{ error, detalles? }`. */
export function respuestaError(error: unknown): Response {
  if (!(error instanceof ErrorApi)) {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
  const cuerpo = error.detalles
    ? { error: error.message, detalles: error.detalles }
    : { error: error.message };
  return Response.json(cuerpo, { status: error.status });
}
