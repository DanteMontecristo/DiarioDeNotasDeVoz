import { obtenerDependencias } from "./dependencias";

const mockDb = { nombre: "base-falsa" };
const mockAlmacen = { nombre: "almacen-falso" };

jest.mock("@/db/conexion", () => ({ obtenerBaseDatos: () => Promise.resolve(mockDb) }));
// Con un getter, el valor se lee al usarlo y no al cargar el módulo.
jest.mock("./almacenAudio", () => ({
  get almacenAudio() {
    return mockAlmacen;
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "uuid-de-prueba" }));

describe("obtenerDependencias", () => {
  it("reúne la base de datos, el almacén de audio, el generador de UUID y el reloj", async () => {
    const antes = Date.now();

    const deps = await obtenerDependencias();

    expect(deps.db).toBe(mockDb);
    expect(deps.almacen).toBe(mockAlmacen);
    expect(deps.generarId()).toBe("uuid-de-prueba");
    expect(deps.ahora().getTime()).toBeGreaterThanOrEqual(antes);
  });
});
