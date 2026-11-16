export type Parametro = string | number | null;
export type Fila = Record<string, unknown>;

/**
 * Lo mínimo que el código necesita de una base SQLite.
 * La cumple `expo-sqlite` en el teléfono y una base en memoria en las pruebas.
 */
export type BaseDatos = {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    parametros: Parametro[],
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync(sql: string, parametros: Parametro[]): Promise<Fila[]>;
  getFirstAsync(sql: string, parametros: Parametro[]): Promise<Fila | null>;
  withTransactionAsync(tarea: () => Promise<void>): Promise<void>;
};
