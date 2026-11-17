export type Usuario = { id: string; email: string | null };
export type Sesion = { token: string; refreshToken: string; usuario: Usuario };
export type DetalleError = { campo: string; mensaje: string };

export type AlmacenSesion = {
  leer(): Promise<Sesion | null>;
  guardar(sesion: Sesion): Promise<void>;
  borrar(): Promise<void>;
};

export type Cliente = {
  /** Rutas que no exigen sesión: salud, registro, login. */
  publica(metodo: string, ruta: string, cuerpo?: unknown): Promise<unknown>;
  /** Rutas con `Authorization: Bearer`; ante un 401 renueva el token una vez y reintenta. */
  privada(metodo: string, ruta: string, cuerpo?: unknown): Promise<unknown>;
};

type Opciones = { urlBase: string; almacen: AlmacenSesion; pedir?: typeof fetch };
type Envio = { metodo: string; ruta: string; cuerpo?: unknown; token?: string };

/** Error de una llamada a la API. `status` 0 significa que no hubo conexión. */
export class ErrorCliente extends Error {
  readonly status: number;
  readonly detalles: DetalleError[];

  constructor(status: number, mensaje: string, detalles: DetalleError[] = []) {
    super(mensaje);
    this.name = "ErrorCliente";
    this.status = status;
    this.detalles = detalles;
  }
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esDetalle(valor: unknown): valor is DetalleError {
  return esObjeto(valor) && typeof valor.campo === "string" && typeof valor.mensaje === "string";
}

function errorDe(status: number, cuerpo: unknown): ErrorCliente {
  if (!esObjeto(cuerpo) || typeof cuerpo.error !== "string") {
    return new ErrorCliente(status, "El servidor respondió con un error.");
  }
  const detalles = Array.isArray(cuerpo.detalles) ? cuerpo.detalles.filter(esDetalle) : [];
  return new ErrorCliente(status, cuerpo.error, detalles);
}

async function leer(respuesta: Response): Promise<unknown> {
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw errorDe(respuesta.status, cuerpo);
  }
  return cuerpo;
}

function cabeceras({ cuerpo, token }: Envio): Record<string, string> {
  return {
    ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function tokensDe(datos: unknown): Pick<Sesion, "token" | "refreshToken"> | null {
  if (!esObjeto(datos)) {
    return null;
  }
  const { token, refreshToken } = datos;
  if (typeof token !== "string" || typeof refreshToken !== "string") {
    return null;
  }
  return { token, refreshToken };
}

async function enviarA(pedir: typeof fetch, urlBase: string, envio: Envio): Promise<Response> {
  try {
    return await pedir(`${urlBase}${envio.ruta}`, {
      method: envio.metodo,
      headers: cabeceras(envio),
      body: envio.cuerpo === undefined ? undefined : JSON.stringify(envio.cuerpo),
    });
  } catch {
    throw new ErrorCliente(0, "No hay conexión con el servidor.");
  }
}

const SESION_VENCIDA = "Tu sesión venció. Inicia sesión de nuevo.";

export function crearCliente({ urlBase, almacen, pedir = fetch }: Opciones): Cliente {
  let renovacion: Promise<Sesion | null> | null = null;

  const enviar = (envio: Envio) => enviarA(pedir, urlBase, envio);

  /** Pide tokens nuevos. Devuelve `null` si el servidor rechaza el refresh token. */
  async function renovar(sesion: Sesion): Promise<Sesion | null> {
    const cuerpo = { refreshToken: sesion.refreshToken };
    const respuesta = await enviar({ metodo: "POST", ruta: "/api/auth/refresh", cuerpo });
    const datos: unknown = await respuesta.json().catch(() => null);
    const tokens = respuesta.ok ? tokensDe(datos) : null;
    if (!tokens) {
      return null;
    }
    const nueva = { ...sesion, ...tokens };
    await almacen.guardar(nueva);
    return nueva;
  }

  /** Varias peticiones que fallan a la vez comparten una sola renovación. */
  function renovarUnaVez(sesion: Sesion): Promise<Sesion | null> {
    renovacion ??= renovar(sesion).finally(() => {
      renovacion = null;
    });
    return renovacion;
  }

  async function cerrarPorVencimiento(): Promise<never> {
    await almacen.borrar();
    throw new ErrorCliente(401, SESION_VENCIDA);
  }

  async function privada(metodo: string, ruta: string, cuerpo?: unknown): Promise<unknown> {
    const sesion = await almacen.leer();
    if (!sesion) {
      throw new ErrorCliente(401, "Inicia sesión para continuar.");
    }
    const primera = await enviar({ metodo, ruta, cuerpo, token: sesion.token });
    if (primera.status !== 401) {
      return leer(primera);
    }
    const nueva = await renovarUnaVez(sesion);
    if (!nueva) {
      return cerrarPorVencimiento();
    }
    const segunda = await enviar({ metodo, ruta, cuerpo, token: nueva.token });
    return segunda.status === 401 ? cerrarPorVencimiento() : leer(segunda);
  }

  return {
    publica: async (metodo, ruta, cuerpo) => leer(await enviar({ metodo, ruta, cuerpo })),
    privada,
  };
}
