import type { BaseDatos } from "./tipos";

/**
 * Una entrada por versión del esquema, en orden. Nunca se edita una ya publicada:
 * para cambiar la base se agrega una nueva al final.
 */
const MIGRACIONES: readonly string[] = [
  `CREATE TABLE nota_voz (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     titulo TEXT NOT NULL,
     archivo_uri TEXT NOT NULL,
     duracion_ms INTEGER NOT NULL CHECK (duracion_ms >= 1000),
     etiqueta TEXT,
     lat REAL, lng REAL,
     creada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     remote_id TEXT,
     updated_at TEXT,
     deleted INTEGER NOT NULL DEFAULT 0,
     pending INTEGER NOT NULL DEFAULT 0
   );
   CREATE UNIQUE INDEX idx_nota_voz_remote_id ON nota_voz (remote_id);
   CREATE INDEX idx_nota_voz_creada_en ON nota_voz (creada_en);`,
  `CREATE TABLE ajuste (
     clave TEXT PRIMARY KEY,
     valor TEXT NOT NULL
   );`,
];

export const VERSION_ESQUEMA = MIGRACIONES.length;

async function aplicar(db: BaseDatos, sql: string, version: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(sql);
    // PRAGMA no admite parámetros; `version` es un entero interno, nunca un dato del usuario.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  });
}

/** Lleva la base a la última versión aplicando solo las migraciones que falten. */
export async function migrar(db: BaseDatos): Promise<void> {
  const fila = await db.getFirstAsync("PRAGMA user_version", []);
  const actual = typeof fila?.user_version === "number" ? fila.user_version : 0;
  for (const [indice, sql] of MIGRACIONES.entries()) {
    if (indice >= actual) {
      await aplicar(db, sql, indice + 1);
    }
  }
}
