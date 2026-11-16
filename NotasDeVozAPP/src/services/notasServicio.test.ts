import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";
import { migrar } from "@/db/migraciones";
import { listarNotas } from "@/repositories/notasRepositorio";
import {
  buscarNotas,
  type DependenciasNotas,
  eliminarNotaConArchivo,
  type GrabacionTerminada,
  guardarGrabacion,
  obtenerNotaPorId,
  renombrarNota,
} from "./notasServicio";

const TEMPORAL = "file:///cache/grabacion-temporal.m4a";
const AHORA = new Date(2026, 10, 1, 15, 4, 5);

let deps: DependenciasNotas;
let guardar: jest.Mock<Promise<string>, [string, string]>;
let borrar: jest.Mock<Promise<void>, [string]>;

beforeEach(async () => {
  const db = crearBaseDePrueba();
  await migrar(db);
  guardar = jest.fn((_uri: string, nombre: string) =>
    Promise.resolve(`file:///documentos/notas/${nombre}`),
  );
  borrar = jest.fn((_uri: string) => Promise.resolve());
  deps = {
    db,
    almacen: { guardar, borrar, existe: () => Promise.resolve(true) },
    generarId: () => "uuid-1",
    ahora: () => AHORA,
  };
});

function grabacion(cambios: Partial<GrabacionTerminada> = {}): GrabacionTerminada {
  return {
    uriTemporal: TEMPORAL,
    duracionMs: 5000,
    titulo: "Idea",
    etiqueta: null,
    lugar: null,
    ...cambios,
  };
}

describe("guardarGrabacion: grabación válida", () => {
  it("mueve el audio a un lugar persistente y guarda la nota", async () => {
    const lugar = { lat: 6.2, lng: -75.5 };

    const resultado = await guardarGrabacion(deps, grabacion({ etiqueta: " clase ", lugar }));

    expect(guardar).toHaveBeenCalledWith(TEMPORAL, "uuid-1.m4a");
    expect(resultado).toEqual({
      ok: true,
      nota: expect.objectContaining({
        titulo: "Idea",
        archivoUri: "file:///documentos/notas/uuid-1.m4a",
        duracionMs: 5000,
        etiqueta: "clase",
        lat: 6.2,
        lng: -75.5,
        creadaEn: AHORA.toISOString(),
        remoteId: "uuid-1",
        pendiente: true,
      }),
    });
    expect(await listarNotas(deps.db)).toHaveLength(1);
  });

  it("sin título usa «Nota del <fecha>»", async () => {
    const resultado = await guardarGrabacion(deps, grabacion({ titulo: "  " }));

    expect(resultado).toMatchObject({ ok: true, nota: { titulo: "Nota del 01/11/2026" } });
  });

  it("si el límite la detuvo unos milisegundos tarde, guarda 120 s exactos", async () => {
    const resultado = await guardarGrabacion(deps, grabacion({ duracionMs: 120_350 }));

    expect(resultado).toMatchObject({ ok: true, nota: { duracionMs: 120_000 } });
  });

  it("conserva la extensión del archivo grabado", async () => {
    await guardarGrabacion(deps, grabacion({ uriTemporal: "file:///cache/audio.3gp" }));

    expect(guardar).toHaveBeenCalledWith("file:///cache/audio.3gp", "uuid-1.3gp");
  });
});

describe("guardarGrabacion: rechazos", () => {
  it("rechaza una grabación de menos de 1 s y borra el audio temporal", async () => {
    const resultado = await guardarGrabacion(deps, grabacion({ duracionMs: 999 }));

    expect(resultado).toEqual({
      ok: false,
      error: "La grabación duró menos de 1 segundo y se descartó.",
    });
    expect(borrar).toHaveBeenCalledWith(TEMPORAL);
    expect(guardar).not.toHaveBeenCalled();
    expect(await listarNotas(deps.db)).toEqual([]);
  });

  it("con un título demasiado largo no guarda nada ni pierde el audio", async () => {
    const resultado = await guardarGrabacion(deps, grabacion({ titulo: "a".repeat(61) }));

    expect(resultado).toEqual({ ok: false, error: "El título puede tener máximo 60 caracteres." });
    expect(guardar).not.toHaveBeenCalled();
    expect(borrar).not.toHaveBeenCalled();
  });

  it("con una etiqueta demasiado larga no guarda nada", async () => {
    const resultado = await guardarGrabacion(deps, grabacion({ etiqueta: "a".repeat(31) }));

    expect(resultado).toMatchObject({ ok: false });
    expect(guardar).not.toHaveBeenCalled();
  });

  it("si la base falla después de mover el audio, lo borra para no dejar huérfanos", async () => {
    deps.db.runAsync = () => Promise.reject(new Error("disco lleno"));

    await expect(guardarGrabacion(deps, grabacion())).rejects.toThrow("disco lleno");

    expect(borrar).toHaveBeenCalledWith("file:///documentos/notas/uuid-1.m4a");
  });
});

describe("eliminarNotaConArchivo", () => {
  async function crearNota(): Promise<number> {
    const resultado = await guardarGrabacion(deps, grabacion());
    return resultado.ok ? resultado.nota.id : -1;
  }

  it("elimina la nota y borra su archivo de audio", async () => {
    const id = await crearNota();

    expect(await eliminarNotaConArchivo(deps, id)).toBe(true);
    expect(borrar).toHaveBeenCalledWith("file:///documentos/notas/uuid-1.m4a");
    expect(await listarNotas(deps.db)).toEqual([]);
  });

  it("devuelve false y no borra archivos si la nota no existe", async () => {
    expect(await eliminarNotaConArchivo(deps, 99)).toBe(false);
    expect(borrar).not.toHaveBeenCalled();
  });

  it("si el archivo no se puede borrar, la nota queda eliminada igual", async () => {
    const id = await crearNota();
    borrar.mockRejectedValueOnce(new Error("el archivo ya no existe"));

    expect(await eliminarNotaConArchivo(deps, id)).toBe(true);
    expect(await listarNotas(deps.db)).toEqual([]);
  });
});

describe("renombrarNota", () => {
  async function crearNota(): Promise<number> {
    const resultado = await guardarGrabacion(deps, grabacion());
    return resultado.ok ? resultado.nota.id : -1;
  }

  it("cambia el título y la etiqueta", async () => {
    const id = await crearNota();

    expect(await renombrarNota(deps, id, { titulo: " Otro ", etiqueta: "casa" })).toEqual({
      ok: true,
    });
    expect(await listarNotas(deps.db)).toMatchObject([{ titulo: "Otro", etiqueta: "casa" }]);
  });

  it("rechaza un título demasiado largo sin cambiar la nota", async () => {
    const id = await crearNota();

    const resultado = await renombrarNota(deps, id, { titulo: "a".repeat(61), etiqueta: null });

    expect(resultado).toEqual({ ok: false, error: "El título puede tener máximo 60 caracteres." });
    expect(await listarNotas(deps.db)).toMatchObject([{ titulo: "Idea" }]);
  });

  it("avisa si la nota ya no existe", async () => {
    expect(await renombrarNota(deps, 99, { titulo: "Otro", etiqueta: null })).toEqual({
      ok: false,
      error: "La nota ya no existe.",
    });
  });
});

describe("buscarNotas y obtenerNotaPorId", () => {
  it("lista las notas y las filtra por título o etiqueta", async () => {
    await guardarGrabacion(deps, grabacion({ titulo: "Lista de compras" }));
    deps.generarId = () => "uuid-2";
    await guardarGrabacion(deps, grabacion({ titulo: "Apuntes", etiqueta: "clase" }));

    expect(await buscarNotas(deps, "")).toHaveLength(2);
    expect(await buscarNotas(deps, "clase")).toMatchObject([{ titulo: "Apuntes" }]);
  });

  it("devuelve una nota por su id, o null si no existe", async () => {
    const resultado = await guardarGrabacion(deps, grabacion());
    const id = resultado.ok ? resultado.nota.id : -1;

    expect(await obtenerNotaPorId(deps, id)).toMatchObject({ titulo: "Idea" });
    expect(await obtenerNotaPorId(deps, 99)).toBeNull();
  });
});
