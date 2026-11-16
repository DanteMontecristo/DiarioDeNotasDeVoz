import { ErrorApi } from "./errores";
import { obtenerAuth } from "./firebase";

export type Usuario = { id: string; email: string | null };

const PREFIJO = "Bearer ";

function leerToken(peticion: Request): string {
  const cabecera = peticion.headers.get("authorization") ?? "";
  const token = cabecera.startsWith(PREFIJO) ? cabecera.slice(PREFIJO.length).trim() : "";
  if (!token) {
    throw new ErrorApi(401, "No autenticado");
  }
  return token;
}

/** Los errores del Admin SDK sobre el token traen un `code` que empieza por "auth/". */
function esRechazoDelToken(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return typeof error.code === "string" && error.code.startsWith("auth/");
}

/**
 * Exige un ID token válido en `Authorization: Bearer <token>`.
 * El usuario sale únicamente del token verificado, nunca del cuerpo ni de la URL.
 */
export async function exigirUsuario(peticion: Request): Promise<Usuario> {
  const token = leerToken(peticion);
  try {
    const datos = await obtenerAuth().verifyIdToken(token);
    return { id: datos.uid, email: datos.email ?? null };
  } catch (error) {
    if (esRechazoDelToken(error)) {
      throw new ErrorApi(401, "Sesión inválida o vencida");
    }
    throw error;
  }
}
