import { z } from "zod";
import { leerEntorno } from "./entorno";
import { ErrorApi } from "./errores";

const URL_CUENTAS = "https://identitytoolkit.googleapis.com/v1/accounts";
const URL_TOKEN = "https://securetoken.googleapis.com/v1/token";

export type Sesion = { token: string; refreshToken: string; expiraEnSeg: number };
export type SesionConUsuario = Sesion & { usuario: { id: string; email: string } };

/** Código de error de Firebase (por prefijo) → código HTTP y mensaje para el cliente. */
type Regla = readonly [prefijo: string, status: number, mensaje: string];

const CREDENCIALES = "Credenciales inválidas";
const REGLAS_CUENTA: readonly Regla[] = [
  ["EMAIL_EXISTS", 409, "El correo ya está registrado"],
  ["WEAK_PASSWORD", 400, "La contraseña es demasiado débil"],
  ["INVALID_EMAIL", 400, "El correo no es válido"],
  ["TOO_MANY_ATTEMPTS_TRY_LATER", 429, "Demasiados intentos, intente más tarde"],
  // El mismo mensaje exista o no el correo: no se revela qué cuentas existen.
  ["INVALID_LOGIN_CREDENTIALS", 401, CREDENCIALES],
  ["EMAIL_NOT_FOUND", 401, CREDENCIALES],
  ["INVALID_PASSWORD", 401, CREDENCIALES],
  ["USER_DISABLED", 401, CREDENCIALES],
];

const SESION = "Sesión inválida";
const REGLAS_TOKEN: readonly Regla[] = [
  ["TOKEN_EXPIRED", 401, SESION],
  ["INVALID_REFRESH_TOKEN", 401, SESION],
  ["USER_NOT_FOUND", 401, SESION],
  ["USER_DISABLED", 401, SESION],
];

const esquemaFallo = z.object({ error: z.object({ message: z.string() }) });
const esquemaCuenta = z.object({
  idToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.coerce.number(),
  localId: z.string().min(1),
  email: z.string().min(1),
});
const esquemaRenovacion = z.object({
  id_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.coerce.number(),
});

function traducirFallo(cuerpo: unknown, reglas: readonly Regla[]): Error {
  const fallo = esquemaFallo.safeParse(cuerpo);
  const codigo = fallo.success ? fallo.data.error.message : "";
  const regla = reglas.find(([prefijo]) => codigo.startsWith(prefijo));
  if (!regla) {
    // No es un ErrorApi: el cliente solo verá "Error interno".
    return new Error("Fallo no previsto de Firebase Auth");
  }
  return new ErrorApi(regla[1], regla[2]);
}

async function pedir(url: string, opciones: RequestInit, reglas: readonly Regla[]) {
  const clave = encodeURIComponent(leerEntorno().webApiKey);
  const respuesta = await fetch(`${url}?key=${clave}`, { method: "POST", ...opciones });
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw traducirFallo(cuerpo, reglas);
  }
  return cuerpo;
}

async function pedirCuenta(
  accion: string,
  email: string,
  password: string,
): Promise<SesionConUsuario> {
  const opciones = {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  };
  const cuerpo = await pedir(`${URL_CUENTAS}:${accion}`, opciones, REGLAS_CUENTA);
  const cuenta = esquemaCuenta.parse(cuerpo);
  return {
    token: cuenta.idToken,
    refreshToken: cuenta.refreshToken,
    expiraEnSeg: cuenta.expiresIn,
    usuario: { id: cuenta.localId, email: cuenta.email },
  };
}

export function registrar(email: string, password: string): Promise<SesionConUsuario> {
  return pedirCuenta("signUp", email, password);
}

export function iniciarSesion(email: string, password: string): Promise<SesionConUsuario> {
  return pedirCuenta("signInWithPassword", email, password);
}

export async function renovar(refreshToken: string): Promise<Sesion> {
  const formulario = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const opciones = {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formulario.toString(),
  };
  const datos = esquemaRenovacion.parse(await pedir(URL_TOKEN, opciones, REGLAS_TOKEN));
  return {
    token: datos.id_token,
    refreshToken: datos.refresh_token,
    expiraEnSeg: datos.expires_in,
  };
}
