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

/** Lee el cuerpo JSON de la petición; si no es JSON válido responde 400. */
export async function leerJson(peticion: Request): Promise<unknown> {
  try {
    const cuerpo: unknown = await peticion.json();
    return cuerpo;
  } catch {
    throw new ErrorApi(400, "El cuerpo debe ser JSON válido");
  }
}
