import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirestoreFalso } from "@/pruebas/firestore-falso";

const caja = vi.hoisted(() => ({ db: undefined as FirestoreFalso | undefined }));
vi.mock("@/lib/firebase", () => ({ obtenerDb: () => caja.db }));

import { borrar, guardar, listarGrabadasEntre } from "./repositorio";

const ANA = "uid-ana";
const INICIO = "2026-11-02T00:00:00.000Z";
const FIN = "2026-11-09T00:00:00.000Z";
const AHORA = "2026-11-10T00:00:00.000Z";

function datos(grabada_en: string) {
  return { titulo: "Idea", duracion_ms: 5000, etiqueta: null, lat: null, lng: null, grabada_en };
}

async function idsDeLaSemana(uid: string): Promise<string[]> {
  return (await listarGrabadasEntre(uid, INICIO, FIN)).map((nota) => nota.id);
}

describe("listarGrabadasEntre", () => {
  beforeEach(() => {
    caja.db = new FirestoreFalso();
  });

  it("incluye el inicio del rango y excluye el fin", async () => {
    await guardar(ANA, "antes", datos("2026-11-01T23:59:59.999Z"), AHORA);
    await guardar(ANA, "en-el-inicio", datos(INICIO), AHORA);
    await guardar(ANA, "dentro", datos("2026-11-05T12:00:00.000Z"), AHORA);
    await guardar(ANA, "en-el-fin", datos(FIN), AHORA);

    expect((await idsDeLaSemana(ANA)).sort()).toEqual(["dentro", "en-el-inicio"]);
  });

  it("no cuenta las notas con borrado lógico", async () => {
    await guardar(ANA, "viva", datos("2026-11-05T12:00:00.000Z"), AHORA);
    await guardar(ANA, "borrada", datos("2026-11-05T13:00:00.000Z"), AHORA);
    await borrar(ANA, "borrada", AHORA);

    expect(await idsDeLaSemana(ANA)).toEqual(["viva"]);
  });

  it("no incluye notas de otro usuario", async () => {
    await guardar(ANA, "de-ana", datos("2026-11-05T12:00:00.000Z"), AHORA);

    expect(await idsDeLaSemana("uid-luis")).toEqual([]);
  });
});
