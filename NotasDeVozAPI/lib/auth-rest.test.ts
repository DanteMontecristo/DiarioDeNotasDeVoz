import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "./errores";
import { iniciarSesion, registrar, renovar } from "./auth-rest";

const fetchFalso = vi.fn<typeof fetch>();

function responder(status: number, cuerpo: unknown): void {
  fetchFalso.mockResolvedValueOnce(Response.json(cuerpo, { status }));
}

function fallar(codigo: string): void {
  responder(400, { error: { code: 400, message: codigo } });
}

async function capturar(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  return undefined;
}

const cuentaFirebase = {
  idToken: "id-token-falso",
  refreshToken: "refresh-falso",
  expiresIn: "3600",
  localId: "uid-1",
  email: "ana@correo.test",
};

beforeEach(() => {
  fetchFalso.mockReset();
  vi.stubGlobal("fetch", fetchFalso);
  vi.stubEnv("FIREBASE_PROJECT_ID", "demo-notas-de-voz");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "cuenta-falsa@demo.iam.gserviceaccount.com");
  vi.stubEnv("FIREBASE_PRIVATE_KEY", "CLAVE-FALSA");
  vi.stubEnv("FIREBASE_WEB_API_KEY", "CLAVE-WEB-FALSA");
});

describe("registrar", () => {
  it("llama a accounts:signUp con la clave web y devuelve la sesión", async () => {
    responder(200, cuentaFirebase);

    const sesion = await registrar("ana@correo.test", "secreta-123");

    expect(sesion).toEqual({
      token: "id-token-falso",
      refreshToken: "refresh-falso",
      expiraEnSeg: 3600,
      usuario: { id: "uid-1", email: "ana@correo.test" },
    });
    const [url, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=CLAVE-WEB-FALSA",
    );
    expect(opciones?.method).toBe("POST");
    expect(JSON.parse(String(opciones?.body))).toEqual({
      email: "ana@correo.test",
      password: "secreta-123",
      returnSecureToken: true,
    });
  });

  it("responde 409 si el correo ya existe", async () => {
    fallar("EMAIL_EXISTS");

    expect(await capturar(registrar("ana@correo.test", "secreta-123"))).toMatchObject({
      status: 409,
      message: "El correo ya está registrado",
    });
  });

  it("responde 400 si Firebase considera débil la contraseña", async () => {
    fallar("WEAK_PASSWORD : Password should be at least 6 characters");

    expect(await capturar(registrar("ana@correo.test", "123"))).toMatchObject({ status: 400 });
  });
});

describe("iniciarSesion", () => {
  it("llama a accounts:signInWithPassword y devuelve la sesión", async () => {
    responder(200, cuentaFirebase);

    const sesion = await iniciarSesion("ana@correo.test", "secreta-123");

    expect(sesion.usuario).toEqual({ id: "uid-1", email: "ana@correo.test" });
    expect(String(fetchFalso.mock.calls[0]?.[0])).toContain("accounts:signInWithPassword");
  });

  it.each(["INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND", "INVALID_PASSWORD", "USER_DISABLED"])(
    "responde 401 con el mismo mensaje ante %s",
    async (codigo) => {
      fallar(codigo);

      expect(await capturar(iniciarSesion("ana@correo.test", "mala"))).toMatchObject({
        status: 401,
        message: "Credenciales inválidas",
      });
    },
  );

  it("responde 429 ante demasiados intentos", async () => {
    fallar("TOO_MANY_ATTEMPTS_TRY_LATER : Access temporarily disabled");

    expect(await capturar(iniciarSesion("ana@correo.test", "mala"))).toMatchObject({
      status: 429,
    });
  });

  it("trata como error interno un fallo no previsto de Firebase", async () => {
    fallar("API_KEY_INVALID");

    const error = await capturar(iniciarSesion("ana@correo.test", "secreta-123"));

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ErrorApi);
  });

  it("trata como error interno una respuesta sin el formato esperado", async () => {
    responder(200, { inesperado: true });

    const error = await capturar(iniciarSesion("ana@correo.test", "secreta-123"));

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ErrorApi);
  });

  it("trata como error interno un fallo cuyo cuerpo no es JSON", async () => {
    fetchFalso.mockResolvedValueOnce(new Response("<html>502</html>", { status: 502 }));

    const error = await capturar(iniciarSesion("ana@correo.test", "secreta-123"));

    expect(error).not.toBeInstanceOf(ErrorApi);
  });
});

describe("renovar", () => {
  it("llama a securetoken con el refresh token como formulario", async () => {
    responder(200, { id_token: "nuevo-id", refresh_token: "nuevo-refresh", expires_in: "3600" });

    const sesion = await renovar("refresh-falso");

    expect(sesion).toEqual({ token: "nuevo-id", refreshToken: "nuevo-refresh", expiraEnSeg: 3600 });
    const [url, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe("https://securetoken.googleapis.com/v1/token?key=CLAVE-WEB-FALSA");
    expect(String(opciones?.body)).toBe("grant_type=refresh_token&refresh_token=refresh-falso");
  });

  it.each(["TOKEN_EXPIRED", "INVALID_REFRESH_TOKEN", "USER_NOT_FOUND", "USER_DISABLED"])(
    "responde 401 ante %s",
    async (codigo) => {
      fallar(codigo);

      expect(await capturar(renovar("refresh-malo"))).toMatchObject({
        status: 401,
        message: "Sesión inválida",
      });
    },
  );
});
