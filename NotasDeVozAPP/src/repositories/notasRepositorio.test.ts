import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";
import { migrar } from "@/db/migraciones";
import type { BaseDatos } from "@/db/tipos";
import {
  actualizarNota,
  eliminarNota,
  insertarNota,
  listarNotas,
  type NotaNueva,
  obtenerNota,
} from "./notasRepositorio";

const T1 = "2026-11-01T10:00:00.000Z";
const T2 = "2026-11-01T11:00:00.000Z";
const T3 = "2026-11-01T12:00:00.000Z";

let consecutivo = 0;

/** Cada nota de prueba recibe su propio identificador remoto, como en la app. */
function nueva(cambios: Partial<NotaNueva> = {}): NotaNueva {
  consecutivo += 1;
  return {
    titulo: "Idea para el proyecto",
    archivoUri: "file:///notas/1.m4a",
    duracionMs: 5000,
    etiqueta: null,
    lat: null,
    lng: null,
    creadaEn: T1,
    remoteId: `remoto-${consecutivo}`,
    ...cambios,
  };
}

let db: BaseDatos;

beforeEach(async () => {
  db = crearBaseDePrueba();
  await migrar(db);
});

async function titulos(busqueda?: string): Promise<string[]> {
  return (await listarNotas(db, busqueda)).map((nota) => nota.titulo);
}

describe("insertarNota y obtenerNota", () => {
  it("guarda la nota y la deja pendiente de sincronizar", async () => {
    const nota = await insertarNota(
      db,
      nueva({
        etiqueta: "clase",
        lat: 6.2,
        lng: -75.5,
        remoteId: "3f2b8c1e-5d4a-4b7c-9e1f-0a2b3c4d5e6f",
      }),
    );

    expect(nota).toEqual({
      id: 1,
      titulo: "Idea para el proyecto",
      archivoUri: "file:///notas/1.m4a",
      duracionMs: 5000,
      etiqueta: "clase",
      lat: 6.2,
      lng: -75.5,
      creadaEn: T1,
      remoteId: "3f2b8c1e-5d4a-4b7c-9e1f-0a2b3c4d5e6f",
      updatedAt: T1,
      pendiente: true,
    });
    expect(await obtenerNota(db, nota.id)).toEqual(nota);
  });

  it("devuelve null si la nota no existe", async () => {
    expect(await obtenerNota(db, 99)).toBeNull();
  });

  it("guarda tal cual un título con comillas y SQL dentro", async () => {
    const titulo = "Robert'); DROP TABLE nota_voz;--";

    const nota = await insertarNota(db, nueva({ titulo }));

    expect((await obtenerNota(db, nota.id))?.titulo).toBe(titulo);
  });
});

describe("listarNotas", () => {
  beforeEach(async () => {
    await insertarNota(db, nueva({ titulo: "Lista de compras", etiqueta: "casa", creadaEn: T1 }));
    await insertarNota(
      db,
      nueva({ titulo: "Apuntes de cálculo", etiqueta: "Clase", creadaEn: T3 }),
    );
    await insertarNota(db, nueva({ titulo: "Descuento del 50%", etiqueta: null, creadaEn: T2 }));
  });

  it("devuelve todas, de la más reciente a la más antigua", async () => {
    expect(await titulos()).toEqual([
      "Apuntes de cálculo",
      "Descuento del 50%",
      "Lista de compras",
    ]);
  });

  it("busca por una parte del título, sin distinguir mayúsculas", async () => {
    expect(await titulos("COMPRAS")).toEqual(["Lista de compras"]);
  });

  it("busca por etiqueta", async () => {
    expect(await titulos("clase")).toEqual(["Apuntes de cálculo"]);
  });

  it("una búsqueda vacía o de espacios devuelve todas", async () => {
    expect(await titulos("   ")).toHaveLength(3);
  });

  it("trata % y _ como texto, no como comodines", async () => {
    expect(await titulos("%")).toEqual(["Descuento del 50%"]);
    expect(await titulos("_")).toEqual([]);
  });

  it("una búsqueda con SQL dentro no rompe nada ni encuentra nada", async () => {
    expect(await titulos("'; DROP TABLE nota_voz; --")).toEqual([]);
    expect(await titulos()).toHaveLength(3);
  });
});

describe("actualizarNota", () => {
  it("cambia título y etiqueta, y deja la nota pendiente con la nueva fecha", async () => {
    const nota = await insertarNota(db, nueva());

    const cambio = await actualizarNota(db, nota.id, { titulo: "Otro", etiqueta: "casa" }, T2);

    expect(cambio).toBe(true);
    expect(await obtenerNota(db, nota.id)).toMatchObject({
      titulo: "Otro",
      etiqueta: "casa",
      creadaEn: T1,
      updatedAt: T2,
      pendiente: true,
    });
  });

  it("devuelve false si la nota no existe", async () => {
    expect(await actualizarNota(db, 99, { titulo: "Otro", etiqueta: null }, T2)).toBe(false);
  });
});

describe("eliminarNota", () => {
  it("la quita de la lista y devuelve el archivo que hay que borrar", async () => {
    const nota = await insertarNota(db, nueva());

    expect(await eliminarNota(db, nota.id, T2)).toBe("file:///notas/1.m4a");
    expect(await listarNotas(db)).toEqual([]);
    expect(await obtenerNota(db, nota.id)).toBeNull();
  });

  it("conserva la fila marcada como borrada y pendiente, para sincronizar el borrado", async () => {
    const nota = await insertarNota(db, nueva());
    await eliminarNota(db, nota.id, T2);

    expect(await db.getAllAsync("SELECT deleted, pending, updated_at FROM nota_voz", [])).toEqual([
      { deleted: 1, pending: 1, updated_at: T2 },
    ]);
  });

  it("devuelve null si la nota no existe o ya estaba eliminada", async () => {
    const nota = await insertarNota(db, nueva());
    await eliminarNota(db, nota.id, T2);

    expect(await eliminarNota(db, nota.id, T3)).toBeNull();
    expect(await eliminarNota(db, 99, T3)).toBeNull();
  });

  it("una nota eliminada no se puede actualizar", async () => {
    const nota = await insertarNota(db, nueva());
    await eliminarNota(db, nota.id, T2);

    expect(await actualizarNota(db, nota.id, { titulo: "Otro", etiqueta: null }, T3)).toBe(false);
  });
});
