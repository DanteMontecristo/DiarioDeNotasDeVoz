import type { BaseDatos } from "@/db/tipos";

/** Todos los ajustes guardados, como pares clave-valor de texto. */
export async function leerAjustes(db: BaseDatos): Promise<Record<string, string>> {
  const filas = await db.getAllAsync("SELECT clave, valor FROM ajuste", []);
  const ajustes: Record<string, string> = {};
  for (const fila of filas) {
    if (typeof fila.clave === "string" && typeof fila.valor === "string") {
      ajustes[fila.clave] = fila.valor;
    }
  }
  return ajustes;
}

/** Guarda varios ajustes de una vez; si una clave ya existe, reemplaza su valor. */
export async function guardarAjustes(db: BaseDatos, pares: Record<string, string>): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [clave, valor] of Object.entries(pares)) {
      await db.runAsync(
        "INSERT INTO ajuste (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor",
        [clave, valor],
      );
    }
  });
}
