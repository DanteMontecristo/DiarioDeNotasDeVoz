import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";
import { ErrorCliente } from "@/api/clienteHttp";
import { migrar } from "@/db/migraciones";
import type { BaseDatos } from "@/db/tipos";
import {
  actualizarNota,
  eliminarNota,
  insertarNota,
  listarNotas,
  listarPendientes,
} from "@/repositories/notasRepositorio";
import { type DependenciasSincronizacion, sincronizar } from "./sincronizacionServicio";

const T1 = "2026-11-01T10:00:00.000Z";
const T2 = "2026-11-01T11:00:00.000Z";
const SERVIDOR = "2026-11-02T08:00:00.000Z";

type Remota = Record<string, unknown>;

let db: BaseDatos;
let privada: jest.Mock<Promise<unknown>, [string, string, unknown?]>;
let borrarAudio: jest.Mock<Promise<void>, [string]>;
let deps: DependenciasSincronizacion;
/** Lo que el servidor devolverá en cada GET, en orden. */
let paginas: Remota[][];

function remota(cambios: Remota = {}): Remota {
  return {
    id: "remoto-x",
    titulo: "Desde otro teléfono",
    duracion_ms: 8000,
    etiqueta: null,
    lat: null,
    lng: null,
    grabada_en: T1,
    created_at: SERVIDOR,
    updated_at: SERVIDOR,
    deleted_at: null,
    ...cambios,
  };
}

function nueva(remoteId: string, titulo = "Local") {
  return {
    titulo,
    archivoUri: `file:///notas/${remoteId}.m4a`,
    duracionMs: 5000,
    etiqueta: null,
    lat: null,
    lng: null,
    creadaEn: T1,
    remoteId,
  };
}

beforeEach(async () => {
  db = crearBaseDePrueba();
  await migrar(db);
  paginas = [];
  privada = jest.fn((metodo: string, _ruta: string, _cuerpo?: unknown) => {
    if (metodo === "GET") {
      return Promise.resolve<unknown>({ items: paginas.shift() ?? [], servidor_ahora: SERVIDOR });
    }
    return Promise.resolve<unknown>(metodo === "PUT" ? { updated_at: SERVIDOR } : { ok: true });
  });
  borrarAudio = jest.fn((_uri: string) => Promise.resolve());
  deps = { db, cliente: { privada }, borrarAudio, usuarioId: "uid-ana" };
});

function llamadas(metodo: string): [string, string, unknown?][] {
  return privada.mock.calls.filter(([m]) => m === metodo);
}

describe("sincronizar: enviar lo pendiente", () => {
  it("sube cada nota pendiente con los nombres de campo de la API y la deja al día", async () => {
    await insertarNota(db, { ...nueva("remoto-1"), etiqueta: "clase", lat: 6.2, lng: -75.5 });

    const resultado = await sincronizar(deps);

    expect(resultado).toEqual({ ok: true, enviadas: 1, recibidas: 0, rechazadas: 0 });
    expect(llamadas("PUT")).toEqual([
      [
        "PUT",
        "/api/notas-voz/remoto-1",
        {
          titulo: "Local",
          duracion_ms: 5000,
          etiqueta: "clase",
          lat: 6.2,
          lng: -75.5,
          grabada_en: T1,
        },
      ],
    ]);
    expect(await listarPendientes(db)).toEqual([]);
    expect(await listarNotas(db)).toMatchObject([{ pendiente: false, updatedAt: SERVIDOR }]);
  });

  it("avisa al servidor de un borrado y entonces quita la fila del teléfono", async () => {
    const nota = await insertarNota(db, nueva("remoto-1"));
    await sincronizar(deps);
    await eliminarNota(db, nota.id, T2);

    await sincronizar(deps);

    expect(llamadas("DELETE")).toEqual([["DELETE", "/api/notas-voz/remoto-1", undefined]]);
    expect(await db.getAllAsync("SELECT id FROM nota_voz", [])).toEqual([]);
  });

  it("un borrado de una nota que el servidor nunca tuvo (404) también se da por hecho", async () => {
    const nota = await insertarNota(db, nueva("remoto-1"));
    await eliminarNota(db, nota.id, T2);
    privada.mockRejectedValueOnce(new ErrorCliente(404, "La nota no existe"));

    expect(await sincronizar(deps)).toMatchObject({ ok: true, enviadas: 1 });
    expect(await db.getAllAsync("SELECT id FROM nota_voz", [])).toEqual([]);
  });
});

describe("sincronizar: envíos con problemas", () => {
  it("si el servidor rechaza una nota por inválida, sigue con las demás", async () => {
    await insertarNota(db, nueva("remoto-1", "Rechazada"));
    await insertarNota(db, nueva("remoto-2", "Aceptada"));
    privada.mockRejectedValueOnce(new ErrorCliente(400, "Datos inválidos"));

    const resultado = await sincronizar(deps);

    expect(resultado).toMatchObject({ ok: true, enviadas: 1, rechazadas: 1 });
    expect(await listarPendientes(db)).toMatchObject([{ titulo: "Rechazada" }]);
  });

  it("si la nota cambió mientras se enviaba, sigue pendiente para el próximo intento", async () => {
    const nota = await insertarNota(db, nueva("remoto-1"));
    privada.mockImplementationOnce(async () => {
      await actualizarNota(db, nota.id, { titulo: "Editada a mitad", etiqueta: null }, T2);
      return { updated_at: SERVIDOR };
    });

    await sincronizar(deps);

    expect(await listarPendientes(db)).toMatchObject([{ titulo: "Editada a mitad" }]);
  });
});

describe("sincronizar: traer los cambios", () => {
  it("crea en el teléfono una nota hecha en otro dispositivo, sin audio", async () => {
    paginas = [[remota({ id: "remoto-9", etiqueta: "casa" })]];

    const resultado = await sincronizar(deps);

    expect(resultado).toMatchObject({ ok: true, recibidas: 1 });
    expect(await listarNotas(db)).toMatchObject([
      {
        titulo: "Desde otro teléfono",
        remoteId: "remoto-9",
        etiqueta: "casa",
        duracionMs: 8000,
        creadaEn: T1,
        archivoUri: "",
        pendiente: false,
      },
    ]);
  });

  it("actualiza una nota existente con lo que llegó del servidor", async () => {
    await insertarNota(db, nueva("remoto-1"));
    await sincronizar(deps);
    paginas = [[remota({ id: "remoto-1", titulo: "Renombrada en otro lado" })]];

    await sincronizar(deps);

    expect(await listarNotas(db)).toMatchObject([
      { titulo: "Renombrada en otro lado", archivoUri: "file:///notas/remoto-1.m4a" },
    ]);
  });

  it("un borrado hecho en otro dispositivo elimina la nota y su audio aquí", async () => {
    await insertarNota(db, nueva("remoto-1"));
    await sincronizar(deps);
    paginas = [[remota({ id: "remoto-1", deleted_at: SERVIDOR })]];

    await sincronizar(deps);

    expect(await listarNotas(db)).toEqual([]);
    expect(borrarAudio).toHaveBeenCalledWith("file:///notas/remoto-1.m4a");
  });
});

describe("sincronizar: lo que no debe aplicarse", () => {
  it("no pisa una nota con cambios locales que aún no se han enviado", async () => {
    const nota = await insertarNota(db, nueva("remoto-1"));
    await sincronizar(deps);
    privada.mockImplementation((metodo: string) => {
      if (metodo === "PUT") {
        return Promise.reject(new ErrorCliente(400, "Datos inválidos"));
      }
      return Promise.resolve({ items: [remota({ id: "remoto-1", titulo: "Del servidor" })] });
    });
    await actualizarNota(db, nota.id, { titulo: "Cambio local", etiqueta: null }, T2);

    await sincronizar(deps);

    expect(await listarNotas(db)).toMatchObject([{ titulo: "Cambio local", pendiente: true }]);
  });

  it("ignora un elemento del servidor que no tiene la forma esperada", async () => {
    paginas = [[{ id: "roto" }, remota({ id: "remoto-9" })]];

    expect(await sincronizar(deps)).toMatchObject({ ok: true, recibidas: 1 });
  });
});

describe("sincronizar: desde dónde pedir", () => {
  it("la primera vez pide todo y luego solo lo posterior a lo último recibido", async () => {
    paginas = [[remota({ id: "remoto-9", updated_at: "2026-11-02T09:00:00.000Z" })]];
    await sincronizar(deps);

    await sincronizar(deps);

    expect(llamadas("GET").map(([, ruta]) => ruta)).toEqual([
      "/api/notas-voz",
      "/api/notas-voz?since=2026-11-02T09%3A00%3A00.000Z",
    ]);
  });

  it("si llega una página completa de 500, pide la siguiente", async () => {
    const llena = Array.from({ length: 500 }, (_, i) =>
      remota({
        id: `remoto-${i}`,
        updated_at: `2026-11-02T09:00:${String(i % 60).padStart(2, "0")}.000Z`,
      }),
    );
    paginas = [llena, [remota({ id: "remoto-ultima" })]];

    const resultado = await sincronizar(deps);

    expect(llamadas("GET")).toHaveLength(2);
    expect(resultado).toMatchObject({ recibidas: 501 });
  });

  it("cada usuario tiene su propio punto de partida", async () => {
    paginas = [[remota({ id: "remoto-9" })]];
    await sincronizar(deps);

    await sincronizar({ ...deps, usuarioId: "uid-luis" });

    expect(llamadas("GET").at(-1)?.[1]).toBe("/api/notas-voz");
  });
});

describe("sincronizar: fallos", () => {
  it("sin conexión devuelve el error y conserva lo pendiente", async () => {
    await insertarNota(db, nueva("remoto-1"));
    privada.mockRejectedValue(new ErrorCliente(0, "No hay conexión con el servidor."));

    expect(await sincronizar(deps)).toEqual({
      ok: false,
      error: "No hay conexión con el servidor.",
    });
    expect(await listarPendientes(db)).toHaveLength(1);
  });

  it("ante un fallo inesperado devuelve un mensaje genérico", async () => {
    privada.mockRejectedValue(new Error("algo raro"));

    expect(await sincronizar(deps)).toEqual({
      ok: false,
      error: "No se pudo sincronizar. Inténtalo de nuevo.",
    });
  });
});
