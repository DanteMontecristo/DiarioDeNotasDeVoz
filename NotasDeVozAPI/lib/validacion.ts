import { z } from "zod";
import { ErrorApi } from "./errores";

z.config(z.locales.es());

/** Valida `datos` con el esquema y descarta los campos no declarados. */
export function validar<T>(esquema: z.ZodType<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (resultado.success) {
    return resultado.data;
  }
  const detalles = resultado.error.issues.map((problema) => ({
    campo: problema.path.join("."),
    mensaje: problema.message,
  }));
  throw new ErrorApi(400, "Datos inválidos", detalles);
}

/** Las peticiones de la API son pequeñas (credenciales o los metadatos de una nota). */
export const LIMITE_CUERPO_BYTES = 10_240;

function exigirJson(peticion: Request): void {
  const tipo = (peticion.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  if (tipo !== "application/json") {
    throw new ErrorApi(415, "El cuerpo debe enviarse como application/json");
  }
}

function exigirTamano(bytes: number): void {
  if (bytes > LIMITE_CUERPO_BYTES) {
    throw new ErrorApi(413, "El cuerpo es demasiado grande");
  }
}

/**
 * Lee el cuerpo JSON de la petición.
 * Responde 415 si no es `application/json`, 413 si supera el límite y 400 si no es JSON válido.
 */
export async function leerJson(peticion: Request): Promise<unknown> {
  exigirJson(peticion);
  // La cabecera permite rechazar pronto; el tamaño real se mide igual, porque puede faltar.
  exigirTamano(Number(peticion.headers.get("content-length") ?? 0));
  const texto = await peticion.text();
  exigirTamano(new TextEncoder().encode(texto).length);
  try {
    const cuerpo: unknown = JSON.parse(texto);
    return cuerpo;
  } catch {
    throw new ErrorApi(400, "El cuerpo debe ser JSON válido");
  }
}
