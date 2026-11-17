const mockSincronizar = jest.fn();
const mockLeerSesion = jest.fn();
const mockBorrarAudio = jest.fn();
const mockDb = { nombre: "base-falsa" };
const mockCliente = { nombre: "cliente-falso" };

jest.mock("./sincronizacionServicio", () => ({
  sincronizar: (deps: object) => mockSincronizar(deps),
}));
jest.mock("./dependencias", () => ({
  obtenerDependencias: () => Promise.resolve({ db: mockDb, almacen: { borrar: mockBorrarAudio } }),
}));
jest.mock("./dependenciasAcceso", () => ({
  obtenerConexion: () => ({ cliente: mockCliente, almacen: { leer: () => mockLeerSesion() } }),
}));

/** Carga una copia nueva del módulo: cada prueba empieza sin sincronizaciones previas. */
function cargar() {
  jest.resetModules();
  return jest.requireActual<typeof import("./sincronizacion")>("./sincronizacion");
}

const sesion = { token: "t", refreshToken: "r", usuario: { id: "uid-ana", email: "a@b.co" } };
const hecho = { ok: true, enviadas: 1, recibidas: 2, rechazadas: 0 };

beforeEach(() => {
  jest.resetAllMocks();
  mockLeerSesion.mockResolvedValue(sesion);
  mockSincronizar.mockResolvedValue(hecho);
});

describe("sincronizarAhora", () => {
  it("sincroniza con la base, el cliente y el usuario de la sesión", async () => {
    const { sincronizarAhora } = cargar();

    expect(await sincronizarAhora()).toEqual(hecho);
    expect(mockSincronizar).toHaveBeenCalledWith(
      expect.objectContaining({ db: mockDb, cliente: mockCliente, usuarioId: "uid-ana" }),
    );
  });

  it("sin sesión no intenta sincronizar", async () => {
    mockLeerSesion.mockResolvedValue(null);
    const { sincronizarAhora } = cargar();

    expect(await sincronizarAhora()).toEqual({
      ok: false,
      error: "Inicia sesión para sincronizar.",
    });
    expect(mockSincronizar).not.toHaveBeenCalled();
  });

  it("si algo falla al preparar la sincronización, devuelve el motivo", async () => {
    mockLeerSesion.mockRejectedValue(new Error("Falta configurar EXPO_PUBLIC_API_URL"));
    const { sincronizarAhora } = cargar();

    expect(await sincronizarAhora()).toEqual({
      ok: false,
      error: "Falta configurar EXPO_PUBLIC_API_URL",
    });
  });
});

describe("sincronizarEnSegundoPlano", () => {
  it("sincroniza la primera vez y luego espera el intervalo mínimo", async () => {
    const { sincronizarEnSegundoPlano } = cargar();

    expect(await sincronizarEnSegundoPlano(1_000_000)).toBe(true);
    expect(await sincronizarEnSegundoPlano(1_010_000)).toBe(false);
    expect(await sincronizarEnSegundoPlano(1_031_000)).toBe(true);

    expect(mockSincronizar).toHaveBeenCalledTimes(2);
  });

  it("devuelve false si no recibió nada nuevo o si falló, sin lanzar errores", async () => {
    const { sincronizarEnSegundoPlano } = cargar();
    mockSincronizar.mockResolvedValueOnce({ ...hecho, recibidas: 0 });
    expect(await sincronizarEnSegundoPlano(1_000_000)).toBe(false);

    mockSincronizar.mockResolvedValueOnce({ ok: false, error: "sin red" });
    expect(await sincronizarEnSegundoPlano(2_000_000)).toBe(false);
  });
});
