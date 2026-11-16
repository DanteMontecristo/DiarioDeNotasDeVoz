import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirestoreFalso } from "@/pruebas/firestore-falso";

const caja = vi.hoisted(() => ({ db: undefined as FirestoreFalso | undefined }));
vi.mock("@/lib/firebase", () => ({ obtenerDb: () => caja.db }));

import { borrar, guardar, LIMITE_POR_PAGINA, listarDesde } from "./repositorio";

const ANA = "uid-ana";
const LUIS = "uid-luis";
const T1 = "2026-11-01T10:00:00.000Z";
const T2 = "2026-11-01T11:00:00.000Z";
const T3 = "2026-11-01T12:00:00.000Z";

const datos = {
  titulo: "Idea",
  duracion_ms: 5000,
  etiqueta: null,
  lat: null,
  lng: null,
  grabada_en: "2026-11-01T09:59:00.000Z",
};

beforeEach(() => {
  caja.db = new FirestoreFalso();
});

describe("guardar", () => {
  it("crea la nota con las fechas puestas por el servidor", async () => {
    const nota = await guardar(ANA, "nota-1", datos, T1);

    expect(nota).toEqual({
      id: "nota-1",
      ...datos,
      created_at: T1,
      updated_at: T1,
      deleted_at: null,
    });
    expect(await listarDesde(ANA, null)).toEqual([nota]);
  });

  it("al reemplazar conserva created_at y avanza updated_at", async () => {
    await guardar(ANA, "nota-1", datos, T1);

    const nota = await guardar(ANA, "nota-1", { ...datos, titulo: "Idea corregida" }, T2);

    expect(nota).toMatchObject({ titulo: "Idea corregida", created_at: T1, updated_at: T2 });
    expect(await listarDesde(ANA, null)).toHaveLength(1);
  });

  it("repetir la misma escritura no duplica la nota", async () => {
    await guardar(ANA, "nota-1", datos, T1);
    await guardar(ANA, "nota-1", datos, T1);

    expect(await listarDesde(ANA, null)).toHaveLength(1);
  });

  it("una escritura posterior a un borrado gana y restaura la nota", async () => {
    await guardar(ANA, "nota-1", datos, T1);
    await borrar(ANA, "nota-1", T2);

    const nota = await guardar(ANA, "nota-1", datos, T3);

    expect(nota).toMatchObject({ created_at: T1, updated_at: T3, deleted_at: null });
  });
});

describe("listarDesde", () => {
  it("devuelve las notas ordenadas por updated_at", async () => {
    await guardar(ANA, "nota-b", datos, T2);
    await guardar(ANA, "nota-a", datos, T1);

    const ids = (await listarDesde(ANA, null)).map((nota) => nota.id);

    expect(ids).toEqual(["nota-a", "nota-b"]);
  });

  it("con since devuelve solo lo modificado después de esa fecha", async () => {
    await guardar(ANA, "nota-a", datos, T1);
    await guardar(ANA, "nota-b", datos, T2);
    await guardar(ANA, "nota-c", datos, T3);

    const ids = (await listarDesde(ANA, T2)).map((nota) => nota.id);

    expect(ids).toEqual(["nota-c"]);
  });

  it("incluye los borrados lógicos", async () => {
    await guardar(ANA, "nota-a", datos, T1);
    await borrar(ANA, "nota-a", T2);

    expect(await listarDesde(ANA, T1)).toMatchObject([{ id: "nota-a", deleted_at: T2 }]);
  });

  it("entrega como máximo una página", async () => {
    const escrituras = Array.from({ length: LIMITE_POR_PAGINA + 1 }, (_, indice) =>
      guardar(ANA, `nota-${indice}`, datos, T1),
    );
    await Promise.all(escrituras);

    expect(await listarDesde(ANA, null)).toHaveLength(LIMITE_POR_PAGINA);
  });
});

describe("borrar", () => {
  it("marca deleted_at y avanza updated_at sin eliminar el documento", async () => {
    await guardar(ANA, "nota-1", datos, T1);

    expect(await borrar(ANA, "nota-1", T2)).toBe(true);
    expect(await listarDesde(ANA, null)).toMatchObject([
      { id: "nota-1", created_at: T1, updated_at: T2, deleted_at: T2 },
    ]);
  });

  it("devuelve false si la nota no existe", async () => {
    expect(await borrar(ANA, "no-existe", T1)).toBe(false);
  });

  it("borrar dos veces conserva la fecha del primer borrado", async () => {
    await guardar(ANA, "nota-1", datos, T1);
    await borrar(ANA, "nota-1", T2);

    expect(await borrar(ANA, "nota-1", T3)).toBe(true);
    expect(await listarDesde(ANA, null)).toMatchObject([{ updated_at: T2, deleted_at: T2 }]);
  });
});

describe("aislamiento entre usuarios", () => {
  beforeEach(async () => {
    await guardar(ANA, "nota-de-ana", datos, T1);
  });

  it("un usuario no ve las notas de otro", async () => {
    expect(await listarDesde(LUIS, null)).toEqual([]);
  });

  it("un usuario no puede borrar la nota de otro", async () => {
    expect(await borrar(LUIS, "nota-de-ana", T2)).toBe(false);
    expect(await listarDesde(ANA, null)).toMatchObject([{ deleted_at: null }]);
  });

  it("escribir con el mismo id no pisa la nota del otro usuario", async () => {
    await guardar(LUIS, "nota-de-ana", { ...datos, titulo: "De Luis" }, T2);

    expect(await listarDesde(ANA, null)).toMatchObject([{ titulo: "Idea", updated_at: T1 }]);
    expect(await listarDesde(LUIS, null)).toMatchObject([{ titulo: "De Luis" }]);
  });
});
