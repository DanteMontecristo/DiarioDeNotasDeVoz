import { almacenAudio } from "./almacenAudio";

const mockLlamadas: string[] = [];
const mockExistentes = new Set<string>();

jest.mock("expo-file-system", () => {
  function unir(partes: (string | { uri: string })[]): string {
    return partes.map((parte) => (typeof parte === "string" ? parte : parte.uri)).join("/");
  }
  class Directory {
    uri: string;
    constructor(...partes: (string | { uri: string })[]) {
      this.uri = unir(partes);
    }
    create(opciones: object): void {
      mockLlamadas.push(`crear ${this.uri} ${JSON.stringify(opciones)}`);
    }
  }
  class File {
    uri: string;
    constructor(...partes: (string | { uri: string })[]) {
      this.uri = unir(partes);
    }
    get exists(): boolean {
      return mockExistentes.has(this.uri);
    }
    move(destino: { uri: string }): Promise<void> {
      mockLlamadas.push(`mover ${this.uri} -> ${destino.uri}`);
      return Promise.resolve();
    }
    delete(): void {
      mockLlamadas.push(`borrar ${this.uri}`);
    }
  }
  return { Directory, File, Paths: { document: { uri: "file:///documentos" } } };
});

beforeEach(() => {
  mockLlamadas.length = 0;
  mockExistentes.clear();
});

describe("almacenAudio.guardar", () => {
  it("mueve el audio a la carpeta persistente de documentos, no a la caché", async () => {
    const uri = await almacenAudio.guardar("file:///cache/tmp.m4a", "uuid-1.m4a");

    expect(uri).toBe("file:///documentos/notas/uuid-1.m4a");
    expect(mockLlamadas).toEqual([
      'crear file:///documentos/notas {"intermediates":true,"idempotent":true}',
      "mover file:///cache/tmp.m4a -> file:///documentos/notas/uuid-1.m4a",
    ]);
  });
});

describe("almacenAudio.borrar", () => {
  it("borra el archivo si existe", async () => {
    mockExistentes.add("file:///documentos/notas/uuid-1.m4a");

    await almacenAudio.borrar("file:///documentos/notas/uuid-1.m4a");

    expect(mockLlamadas).toEqual(["borrar file:///documentos/notas/uuid-1.m4a"]);
  });

  it("no hace nada si el archivo ya no existe", async () => {
    await almacenAudio.borrar("file:///documentos/notas/perdido.m4a");

    expect(mockLlamadas).toEqual([]);
  });
});

describe("almacenAudio.existe", () => {
  it("dice si el archivo de audio sigue en el teléfono", async () => {
    mockExistentes.add("file:///documentos/notas/uuid-1.m4a");

    expect(await almacenAudio.existe("file:///documentos/notas/uuid-1.m4a")).toBe(true);
    expect(await almacenAudio.existe("file:///documentos/notas/perdido.m4a")).toBe(false);
  });
});

describe("almacenAudio con una nota sin audio", () => {
  it("una ruta vacía no existe y borrarla no hace nada", async () => {
    mockExistentes.add("");

    expect(await almacenAudio.existe("")).toBe(false);
    await almacenAudio.borrar("");

    expect(mockLlamadas).toEqual([]);
  });
});
