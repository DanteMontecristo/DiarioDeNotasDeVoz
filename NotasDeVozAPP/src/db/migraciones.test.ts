import { crearBaseDePrueba } from "../../pruebas/baseDePrueba";
import { migrar, VERSION_ESQUEMA } from "./migraciones";
import type { BaseDatos } from "./tipos";

async function version(db: BaseDatos): Promise<unknown> {
  return (await db.getFirstAsync("PRAGMA user_version", []))?.user_version;
}

async function columnas(db: BaseDatos): Promise<unknown[]> {
  return (await db.getAllAsync("PRAGMA table_info(nota_voz)", [])).map((fila) => fila.name);
}

const INSERTAR = "INSERT INTO nota_voz (titulo, archivo_uri, duracion_ms) VALUES (?, ?, ?)";

describe("migrar", () => {
  it("crea la tabla nota_voz con los campos del dominio y los de sincronización", async () => {
    const db = crearBaseDePrueba();

    await migrar(db);

    expect(await columnas(db)).toEqual([
      "id",
      "titulo",
      "archivo_uri",
      "duracion_ms",
      "etiqueta",
      "lat",
      "lng",
      "creada_en",
      "remote_id",
      "updated_at",
      "deleted",
      "pending",
    ]);
    expect(await version(db)).toBe(VERSION_ESQUEMA);
  });

  it("no hace nada si la base ya está al día, y conserva los datos", async () => {
    const db = crearBaseDePrueba();
    await migrar(db);
    await db.runAsync(INSERTAR, ["Idea", "file:///notas/1.m4a", 5000]);

    await migrar(db);

    expect(await db.getAllAsync("SELECT titulo FROM nota_voz", [])).toEqual([{ titulo: "Idea" }]);
    expect(await version(db)).toBe(VERSION_ESQUEMA);
  });

  it("la base rechaza una duración menor de 1 s", async () => {
    const db = crearBaseDePrueba();
    await migrar(db);

    await expect(db.runAsync(INSERTAR, ["Corta", "file:///notas/2.m4a", 999])).rejects.toThrow(
      /CHECK/,
    );
  });

  it("deja las notas nuevas sin borrar y sin pendientes por defecto", async () => {
    const db = crearBaseDePrueba();
    await migrar(db);
    await db.runAsync(INSERTAR, ["Idea", "file:///notas/1.m4a", 5000]);

    expect(await db.getFirstAsync("SELECT deleted, pending FROM nota_voz", [])).toEqual({
      deleted: 0,
      pending: 0,
    });
  });
});
