import {
  type AlmacenSesion,
  type Cliente,
  ErrorCliente,
  type Sesion,
  type Usuario,
} from "@/api/clienteHttp";
import { esSesion } from "@/api/sesionAlmacen";

export type DependenciasAcceso = { cliente: Pick<Cliente, "publica">; almacen: AlmacenSesion };
export type ResultadoAcceso = { ok: true; usuario: Usuario } | { ok: false; error: string };

const CONTRASENA_MINIMA = 8;

function limpiarCorreo(email: string): string | null {
  const correo = email.trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(correo) ? correo : null;
}

function mensajeDe(error: unknown): string {
  return error instanceof ErrorCliente
    ? error.message
    : "No se pudo completar. Inténtalo de nuevo.";
}

/** Llama a la ruta de acceso y, si responde una sesión completa, la guarda. */
async function acceder(
  deps: DependenciasAcceso,
  ruta: string,
  credenciales: { email: string; password: string },
): Promise<ResultadoAcceso> {
  try {
    const respuesta = await deps.cliente.publica("POST", ruta, credenciales);
    if (!esSesion(respuesta)) {
      return { ok: false, error: "El servidor respondió algo inesperado." };
    }
    const sesion: Sesion = {
      token: respuesta.token,
      refreshToken: respuesta.refreshToken,
      usuario: { id: respuesta.usuario.id, email: respuesta.usuario.email },
    };
    await deps.almacen.guardar(sesion);
    return { ok: true, usuario: sesion.usuario };
  } catch (error) {
    return { ok: false, error: mensajeDe(error) };
  }
}

export async function iniciarSesion(
  deps: DependenciasAcceso,
  email: string,
  password: string,
): Promise<ResultadoAcceso> {
  const correo = limpiarCorreo(email);
  if (!correo) {
    return { ok: false, error: "Escribe un correo válido." };
  }
  if (password === "") {
    return { ok: false, error: "Escribe tu contraseña." };
  }
  return acceder(deps, "/api/auth/login", { email: correo, password });
}

export async function registrar(
  deps: DependenciasAcceso,
  email: string,
  password: string,
): Promise<ResultadoAcceso> {
  const correo = limpiarCorreo(email);
  if (!correo) {
    return { ok: false, error: "Escribe un correo válido." };
  }
  if (password.length < CONTRASENA_MINIMA) {
    return {
      ok: false,
      error: `La contraseña debe tener al menos ${CONTRASENA_MINIMA} caracteres.`,
    };
  }
  return acceder(deps, "/api/auth/registro", { email: correo, password });
}

export async function cerrarSesion(deps: DependenciasAcceso): Promise<void> {
  await deps.almacen.borrar();
}

export async function usuarioActual(deps: DependenciasAcceso): Promise<Usuario | null> {
  return (await deps.almacen.leer())?.usuario ?? null;
}
