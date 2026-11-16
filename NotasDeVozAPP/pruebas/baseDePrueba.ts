import { DatabaseSync } from "node:sqlite";
import type { BaseDatos } from "@/db/tipos";

/**
 * SQLite real en memoria (el que trae Node) con la misma forma que `expo-sqlite`.
 * Así las pruebas ejecutan el SQL de verdad: restricciones, búsquedas y transacciones.
 * Los métodos son `async` para que un error de SQL llegue como promesa rechazada,
 * igual que en el teléfono.
 */
export function crearBaseDePrueba(): BaseDatos {
  const db = new DatabaseSync(":memory:");
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, parametros) {
      const resultado = db.prepare(sql).run(...parametros);
      return {
        lastInsertRowId: Number(resultado.lastInsertRowid),
        changes: Number(resultado.changes),
      };
    },
    async getAllAsync(sql, parametros) {
      return db.prepare(sql).all(...parametros);
    },
    async getFirstAsync(sql, parametros) {
      return db.prepare(sql).get(...parametros) ?? null;
    },
    async withTransactionAsync(tarea) {
      db.exec("BEGIN");
      try {
        await tarea();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
