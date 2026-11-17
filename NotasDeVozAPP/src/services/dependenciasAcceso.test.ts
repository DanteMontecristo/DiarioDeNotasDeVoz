jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

/** Carga una copia nueva del módulo: cada prueba empieza sin conexión creada. */
function cargar() {
  jest.resetModules();
  return jest.requireActual<typeof import("./dependenciasAcceso")>("./dependenciasAcceso");
}

const original = process.env.EXPO_PUBLIC_API_URL;

afterEach(() => {
  process.env.EXPO_PUBLIC_API_URL = original;
});

describe("obtenerConexion", () => {
  it("crea el cliente y el almacén una sola vez", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.test";
    const { obtenerConexion } = cargar();

    const conexion = obtenerConexion();

    expect(typeof conexion.cliente.privada).toBe("function");
    expect(obtenerConexion()).toBe(conexion);
  });

  it("explica qué falta si la URL de la API no está configurada", () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const { obtenerConexion } = cargar();

    expect(() => obtenerConexion()).toThrow("EXPO_PUBLIC_API_URL");
  });
});
