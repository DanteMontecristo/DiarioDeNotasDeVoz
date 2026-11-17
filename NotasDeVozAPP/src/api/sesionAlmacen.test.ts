import type { Sesion } from "./clienteHttp";
import { sesionAlmacen } from "./sesionAlmacen";

const mockDatos = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: (clave: string) => Promise.resolve(mockDatos.get(clave) ?? null),
  setItemAsync: (clave: string, valor: string) => Promise.resolve(void mockDatos.set(clave, valor)),
  deleteItemAsync: (clave: string) => Promise.resolve(void mockDatos.delete(clave)),
}));

const sesion: Sesion = {
  token: "token-1",
  refreshToken: "refresh-1",
  usuario: { id: "uid-1", email: "ana@correo.test" },
};

beforeEach(() => {
  mockDatos.clear();
});

describe("sesionAlmacen", () => {
  it("sin sesión guardada devuelve null", async () => {
    expect(await sesionAlmacen.leer()).toBeNull();
  });

  it("guarda la sesión en el almacenamiento seguro y la vuelve a leer", async () => {
    await sesionAlmacen.guardar(sesion);

    expect(await sesionAlmacen.leer()).toEqual(sesion);
    expect([...mockDatos.keys()]).toEqual(["sesion"]);
  });

  it("borrar la elimina", async () => {
    await sesionAlmacen.guardar(sesion);
    await sesionAlmacen.borrar();

    expect(await sesionAlmacen.leer()).toBeNull();
  });

  it.each(["esto no es json", '{"token":"solo-token"}', "null"])(
    "si lo guardado está dañado (%s) lo trata como sin sesión",
    async (valor) => {
      mockDatos.set("sesion", valor);

      expect(await sesionAlmacen.leer()).toBeNull();
    },
  );
});
