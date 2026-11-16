const LINEAS_DE_PILA = 6;

/** Lo que nunca debe llegar a un log: claves, tokens y correos. */
const PATRONES: readonly (readonly [RegExp, string])[] = [
  [/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[clave oculta]"],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[token oculto]"],
  [/\bBearer\s+\S+/gi, "Bearer [token oculto]"],
  [/\bAIza[\w-]{20,}/g, "[clave oculta]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[correo oculto]"],
];

export function ocultarSecretos(texto: string): string {
  return PATRONES.reduce((limpio, [patron, reemplazo]) => limpio.replace(patron, reemplazo), texto);
}

function leerCodigo(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  return typeof error.code === "string" ? error.code : null;
}

function leerPila(error: unknown): string[] {
  if (!(error instanceof Error) || !error.stack) {
    return [];
  }
  return ocultarSecretos(error.stack).split("\n").slice(0, LINEAS_DE_PILA);
}

/**
 * Deja constancia de un error interno en la salida de errores (los logs de Vercel).
 * Registra la ruta sin sus parámetros y oculta tokens, claves y correos.
 */
export function registrarErrorInterno(error: unknown, peticion: Request): void {
  const esError = error instanceof Error;
  const entrada = {
    nivel: "error",
    metodo: peticion.method,
    ruta: new URL(peticion.url).pathname,
    nombre: esError ? error.name : typeof error,
    mensaje: ocultarSecretos(esError ? error.message : String(error)),
    codigo: leerCodigo(error),
    pila: leerPila(error),
  };
  process.stderr.write(`${JSON.stringify(entrada)}\n`);
}
