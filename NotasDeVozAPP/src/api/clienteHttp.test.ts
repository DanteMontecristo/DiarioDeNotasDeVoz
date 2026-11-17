import { crearCliente, ErrorCliente, type Sesion } from "./clienteHttp";

const URL = "https://api.test";
const sesion: Sesion = {
  token: "token-viejo",
  refreshToken: "refresh-1",
  usuario: { id: "uid-1", email: "ana@correo.test" },
};

type Llamada = { url: string; metodo: string; autorizacion: string | null; cuerpo: unknown };

/** Servidor de mentira: responde en orden lo que se le encola y recuerda cada llamada. */
function crearEscenario(inicial: Sesion | null = sesion) {
  let guardada = inicial;
  const llamadas: Llamada[] = [];
  const respuestas: (Response | Error)[] = [];
  const pedir = async (url: string | URL | Request, opciones?: RequestInit) => {
    const cabeceras = new Headers(opciones?.headers);
    llamadas.push({
      url: String(url),
      metodo: opciones?.method ?? "GET",
      autorizacion: cabeceras.get("authorization"),
      cuerpo: opciones?.body ? JSON.parse(String(opciones.body)) : undefined,
    });
    const siguiente = respuestas.shift();
    if (!siguiente || siguiente instanceof Error) {
      throw siguiente ?? new Error("sin respuesta encolada");
    }
    return siguiente;
  };
  const almacen = {
    leer: async () => guardada,
    guardar: async (nueva: Sesion) => void (guardada = nueva),
    borrar: async () => void (guardada = null),
  };
  return {
    cliente: crearCliente({ urlBase: URL, almacen, pedir }),
    llamadas,
    responder: (status: number, cuerpo: unknown) =>
      respuestas.push(Response.json(cuerpo, { status })),
    fallarRed: () => respuestas.push(new TypeError("Network request failed")),
    sesionGuardada: () => guardada,
  };
}

async function capturar(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("peticiones públicas", () => {
  it("envía JSON sin cabecera de autorización y devuelve el cuerpo", async () => {
    const e = crearEscenario();
    e.responder(200, { ok: true });

    const cuerpo = await e.cliente.publica("POST", "/api/auth/login", { email: "a@b.co" });

    expect(cuerpo).toEqual({ ok: true });
    expect(e.llamadas).toEqual([
      {
        url: `${URL}/api/auth/login`,
        metodo: "POST",
        autorizacion: null,
        cuerpo: { email: "a@b.co" },
      },
    ]);
  });

  it("convierte un error de la API en ErrorCliente con su mensaje y sus detalles", async () => {
    const e = crearEscenario();
    const detalles = [{ campo: "email", mensaje: "Correo inválido" }];
    e.responder(400, { error: "Datos inválidos", detalles });

    const error = await capturar(e.cliente.publica("POST", "/api/auth/registro", {}));

    expect(error).toBeInstanceOf(ErrorCliente);
    expect(error).toMatchObject({ status: 400, message: "Datos inválidos", detalles });
  });

  it("sin conexión lanza un ErrorCliente con estado 0", async () => {
    const e = crearEscenario();
    e.fallarRed();

    const error = await capturar(e.cliente.publica("GET", "/api/health"));

    expect(error).toMatchObject({ status: 0, message: "No hay conexión con el servidor." });
  });

  it("si el servidor responde algo que no es JSON, usa un mensaje genérico", async () => {
    const e = crearEscenario();
    e.responder(502, "puerta de enlace caída");

    expect(await capturar(e.cliente.publica("GET", "/api/health"))).toMatchObject({
      status: 502,
      message: "El servidor respondió con un error.",
    });
  });
});

describe("peticiones privadas", () => {
  it("añade el token de la sesión guardada", async () => {
    const e = crearEscenario();
    e.responder(200, { items: [] });

    await e.cliente.privada("GET", "/api/notas-voz");

    expect(e.llamadas[0]?.autorizacion).toBe("Bearer token-viejo");
  });

  it("sin sesión no llama al servidor", async () => {
    const e = crearEscenario(null);

    const error = await capturar(e.cliente.privada("GET", "/api/notas-voz"));

    expect(error).toMatchObject({ status: 401, message: "Inicia sesión para continuar." });
    expect(e.llamadas).toEqual([]);
  });
});

describe("renovación del token ante un 401", () => {
  it("renueva una vez, guarda los tokens nuevos y reintenta la petición", async () => {
    const e = crearEscenario();
    e.responder(401, { error: "Sesión inválida o vencida" });
    e.responder(200, { token: "token-nuevo", refreshToken: "refresh-2", expiraEnSeg: 3600 });
    e.responder(200, { items: ["nota"] });

    const cuerpo = await e.cliente.privada("GET", "/api/notas-voz");

    expect(cuerpo).toEqual({ items: ["nota"] });
    expect(e.llamadas.map((l) => [l.url, l.autorizacion])).toEqual([
      [`${URL}/api/notas-voz`, "Bearer token-viejo"],
      [`${URL}/api/auth/refresh`, null],
      [`${URL}/api/notas-voz`, "Bearer token-nuevo"],
    ]);
    expect(e.llamadas[1]?.cuerpo).toEqual({ refreshToken: "refresh-1" });
    expect(e.sesionGuardada()).toEqual({
      ...sesion,
      token: "token-nuevo",
      refreshToken: "refresh-2",
    });
  });

  it("si la renovación es rechazada, borra la sesión y pide iniciar sesión", async () => {
    const e = crearEscenario();
    e.responder(401, { error: "Sesión inválida o vencida" });
    e.responder(401, { error: "Sesión inválida" });

    const error = await capturar(e.cliente.privada("GET", "/api/notas-voz"));

    expect(error).toMatchObject({
      status: 401,
      message: "Tu sesión venció. Inicia sesión de nuevo.",
    });
    expect(e.sesionGuardada()).toBeNull();
    expect(e.llamadas).toHaveLength(2);
  });

  it("si el reintento vuelve a dar 401, no entra en un ciclo: borra la sesión", async () => {
    const e = crearEscenario();
    e.responder(401, { error: "x" });
    e.responder(200, { token: "token-nuevo", refreshToken: "refresh-2" });
    e.responder(401, { error: "x" });

    const error = await capturar(e.cliente.privada("GET", "/api/notas-voz"));

    expect(error).toMatchObject({ status: 401 });
    expect(e.llamadas).toHaveLength(3);
    expect(e.sesionGuardada()).toBeNull();
  });
});

describe("renovación del token: casos límite", () => {
  it("si no hay conexión al renovar, conserva la sesión para intentarlo luego", async () => {
    const e = crearEscenario();
    e.responder(401, { error: "x" });
    e.fallarRed();

    const error = await capturar(e.cliente.privada("GET", "/api/notas-voz"));

    expect(error).toMatchObject({ status: 0 });
    expect(e.sesionGuardada()).toEqual(sesion);
  });

  it("dos peticiones que fallan a la vez comparten una sola renovación", async () => {
    const e = crearEscenario();
    e.responder(401, { error: "x" });
    e.responder(401, { error: "x" });
    e.responder(200, { token: "token-nuevo", refreshToken: "refresh-2" });
    e.responder(200, { a: 1 });
    e.responder(200, { b: 2 });

    await Promise.all([e.cliente.privada("GET", "/api/a"), e.cliente.privada("GET", "/api/b")]);

    expect(e.llamadas.filter((l) => l.url.endsWith("/api/auth/refresh"))).toHaveLength(1);
  });
});
