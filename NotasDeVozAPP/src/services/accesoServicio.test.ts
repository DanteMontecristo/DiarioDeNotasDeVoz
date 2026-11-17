import { ErrorCliente, type Sesion } from "@/api/clienteHttp";
import { cerrarSesion, type DependenciasAcceso, iniciarSesion, registrar } from "./accesoServicio";

const respuestaApi = {
  token: "token-1",
  refreshToken: "refresh-1",
  expiraEnSeg: 3600,
  usuario: { id: "uid-1", email: "ana@correo.test" },
};
const sesionEsperada: Sesion = {
  token: "token-1",
  refreshToken: "refresh-1",
  usuario: { id: "uid-1", email: "ana@correo.test" },
};

let guardada: Sesion | null;
let publica: jest.Mock<Promise<unknown>, [string, string, unknown?]>;
let deps: DependenciasAcceso;

beforeEach(() => {
  guardada = null;
  publica = jest.fn((_metodo: string, _ruta: string, _cuerpo?: unknown) =>
    Promise.resolve<unknown>(respuestaApi),
  );
  deps = {
    cliente: { publica },
    almacen: {
      leer: async () => guardada,
      guardar: async (sesion) => void (guardada = sesion),
      borrar: async () => void (guardada = null),
    },
  };
});

describe("iniciarSesion", () => {
  it("llama al login, guarda la sesión y devuelve el usuario", async () => {
    const resultado = await iniciarSesion(deps, " Ana@Correo.test ", "secreta-123");

    expect(publica).toHaveBeenCalledWith("POST", "/api/auth/login", {
      email: "ana@correo.test",
      password: "secreta-123",
    });
    expect(resultado).toEqual({ ok: true, usuario: sesionEsperada.usuario });
    expect(guardada).toEqual(sesionEsperada);
  });

  it.each([
    ["sin correo", "", "secreta-123", "Escribe un correo válido."],
    ["con un correo sin arroba", "ana", "secreta-123", "Escribe un correo válido."],
    ["sin contraseña", "ana@correo.test", "", "Escribe tu contraseña."],
  ])("%s no llama al servidor", async (_caso, email, password, error) => {
    expect(await iniciarSesion(deps, email, password)).toEqual({ ok: false, error });
    expect(publica).not.toHaveBeenCalled();
  });

  it("muestra el mensaje de la API cuando rechaza las credenciales", async () => {
    publica.mockRejectedValueOnce(new ErrorCliente(401, "Credenciales inválidas"));

    expect(await iniciarSesion(deps, "ana@correo.test", "mala")).toEqual({
      ok: false,
      error: "Credenciales inválidas",
    });
    expect(guardada).toBeNull();
  });

  it("si la respuesta no trae lo esperado, no guarda una sesión a medias", async () => {
    publica.mockResolvedValueOnce({ token: "solo-token" });

    expect(await iniciarSesion(deps, "ana@correo.test", "secreta-123")).toEqual({
      ok: false,
      error: "El servidor respondió algo inesperado.",
    });
    expect(guardada).toBeNull();
  });
});

describe("registrar", () => {
  it("llama al registro y guarda la sesión", async () => {
    const resultado = await registrar(deps, "ana@correo.test", "secreta-123");

    expect(publica).toHaveBeenCalledWith("POST", "/api/auth/registro", {
      email: "ana@correo.test",
      password: "secreta-123",
    });
    expect(resultado.ok).toBe(true);
    expect(guardada).toEqual(sesionEsperada);
  });

  it("exige una contraseña de 8 caracteres o más antes de llamar al servidor", async () => {
    expect(await registrar(deps, "ana@correo.test", "1234567")).toEqual({
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    });
    expect(publica).not.toHaveBeenCalled();
  });

  it("muestra el mensaje de la API si el correo ya existe", async () => {
    publica.mockRejectedValueOnce(new ErrorCliente(409, "El correo ya está registrado"));

    expect(await registrar(deps, "ana@correo.test", "secreta-123")).toEqual({
      ok: false,
      error: "El correo ya está registrado",
    });
  });
});

describe("cerrarSesion", () => {
  it("borra la sesión guardada", async () => {
    await iniciarSesion(deps, "ana@correo.test", "secreta-123");

    await cerrarSesion(deps);

    expect(guardada).toBeNull();
  });
});
