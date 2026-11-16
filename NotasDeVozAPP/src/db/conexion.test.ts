import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";

const mockAbrir = jest.fn();
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: mockAbrir }));

/** Carga una copia nueva del módulo: cada prueba empieza sin conexión abierta. */
function cargarConexion() {
  return jest.requireActual<typeof import("./conexion")>("./conexion");
}

describe("obtenerBaseDatos", () => {
  beforeEach(() => {
    jest.resetModules();
    mockAbrir.mockReset();
    mockAbrir.mockImplementation(() => Promise.resolve(crearBaseDePrueba()));
  });

  it("abre la base de la app y la deja migrada", async () => {
    const { obtenerBaseDatos } = cargarConexion();

    const db = await obtenerBaseDatos();

    expect(mockAbrir).toHaveBeenCalledWith("notas-de-voz.db");
    expect(await db.getAllAsync("SELECT * FROM nota_voz", [])).toEqual([]);
  });

  it("abre la base una sola vez aunque se pida varias veces a la vez", async () => {
    const { obtenerBaseDatos } = cargarConexion();

    const [primera, segunda] = await Promise.all([obtenerBaseDatos(), obtenerBaseDatos()]);

    expect(primera).toBe(segunda);
    expect(mockAbrir).toHaveBeenCalledTimes(1);
  });

  it("si abrir falla, el siguiente intento vuelve a probar", async () => {
    const { obtenerBaseDatos } = cargarConexion();
    mockAbrir.mockRejectedValueOnce(new Error("disco lleno"));

    await expect(obtenerBaseDatos()).rejects.toThrow("disco lleno");
    await expect(obtenerBaseDatos()).resolves.toBeDefined();
  });
});
