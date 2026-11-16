import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";
import { migrar } from "@/db/migraciones";
import type { BaseDatos } from "@/db/tipos";
import { AJUSTES_POR_DEFECTO } from "@/utils/ajustes";
import { cambiarAjustes, obtenerAjustes } from "./ajustesServicio";

let db: BaseDatos;

beforeEach(async () => {
  db = crearBaseDePrueba();
  await migrar(db);
});

describe("ajustesServicio", () => {
  it("en una instalación nueva devuelve los ajustes por defecto", async () => {
    expect(await obtenerAjustes({ db })).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("guarda un cambio y devuelve los ajustes completos ya actualizados", async () => {
    const ajustes = await cambiarAjustes({ db }, { limiteMs: 30000 });

    expect(ajustes).toEqual({ ...AJUSTES_POR_DEFECTO, limiteMs: 30000 });
    expect(await obtenerAjustes({ db })).toEqual(ajustes);
  });

  it("cambiar un ajuste no toca los demás", async () => {
    await cambiarAjustes({ db }, { calidad: "baja" });
    await cambiarAjustes({ db }, { guardarLugar: true });

    expect(await obtenerAjustes({ db })).toEqual({
      calidad: "baja",
      limiteMs: 120000,
      guardarLugar: true,
    });
  });

  it("cambiar dos veces el mismo ajuste conserva el último valor", async () => {
    await cambiarAjustes({ db }, { limiteMs: 30000 });
    await cambiarAjustes({ db }, { limiteMs: 60000 });

    expect((await obtenerAjustes({ db })).limiteMs).toBe(60000);
    expect(await db.getAllAsync("SELECT clave FROM ajuste", [])).toHaveLength(1);
  });
});
