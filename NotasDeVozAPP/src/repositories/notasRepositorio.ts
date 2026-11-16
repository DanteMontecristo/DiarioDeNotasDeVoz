import type { BaseDatos, Fila } from "@/db/tipos";

export type Nota = {
  id: number;
  titulo: string;
  archivoUri: string;
  duracionMs: number;
  etiqueta: string | null;
  lat: number | null;
  lng: number | null;
  creadaEn: string;
  remoteId: string;
  updatedAt: string;
  pendiente: boolean;
};

export type NotaNueva = Omit<Nota, "id" | "updatedAt" | "pendiente">;
export type CambiosNota = Pick<Nota, "titulo" | "etiqueta">;

function texto(fila: Fila, columna: string): string {
  const valor = fila[columna];
  if (typeof valor !== "string") {
    throw new Error(`La columna ${columna} no trae un texto`);
  }
  return valor;
}

function numero(fila: Fila, columna: string): number {
  const valor = fila[columna];
  if (typeof valor !== "number") {
    throw new Error(`La columna ${columna} no trae un número`);
  }
  return valor;
}

function aNota(fila: Fila): Nota {
  return {
    id: numero(fila, "id"),
    titulo: texto(fila, "titulo"),
    archivoUri: texto(fila, "archivo_uri"),
    duracionMs: numero(fila, "duracion_ms"),
    etiqueta: fila.etiqueta === null ? null : texto(fila, "etiqueta"),
    lat: fila.lat === null ? null : numero(fila, "lat"),
    lng: fila.lng === null ? null : numero(fila, "lng"),
    creadaEn: texto(fila, "creada_en"),
    remoteId: texto(fila, "remote_id"),
    updatedAt: texto(fila, "updated_at"),
    pendiente: numero(fila, "pending") === 1,
  };
}

/** Escapa los comodines de LIKE para buscar el texto tal cual lo escribió el usuario. */
function patronDeBusqueda(busqueda: string): string {
  return `%${busqueda.trim().replace(/[\\%_]/g, "\\$&")}%`;
}

export async function insertarNota(db: BaseDatos, nota: NotaNueva): Promise<Nota> {
  const resultado = await db.runAsync(
    `INSERT INTO nota_voz
       (titulo, archivo_uri, duracion_ms, etiqueta, lat, lng, creada_en, remote_id, updated_at, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      nota.titulo,
      nota.archivoUri,
      nota.duracionMs,
      nota.etiqueta,
      nota.lat,
      nota.lng,
      nota.creadaEn,
      nota.remoteId,
      nota.creadaEn,
    ],
  );
  return { ...nota, id: resultado.lastInsertRowId, updatedAt: nota.creadaEn, pendiente: true };
}

/** Notas vigentes, de la más reciente a la más antigua; `busqueda` filtra por título o etiqueta. */
export async function listarNotas(db: BaseDatos, busqueda = ""): Promise<Nota[]> {
  const patron = patronDeBusqueda(busqueda);
  const filas = await db.getAllAsync(
    `SELECT * FROM nota_voz
      WHERE deleted = 0 AND (titulo LIKE ? ESCAPE '\\' OR etiqueta LIKE ? ESCAPE '\\')
      ORDER BY creada_en DESC, id DESC`,
    [patron, patron],
  );
  return filas.map(aNota);
}

export async function obtenerNota(db: BaseDatos, id: number): Promise<Nota | null> {
  const fila = await db.getFirstAsync("SELECT * FROM nota_voz WHERE id = ? AND deleted = 0", [id]);
  return fila ? aNota(fila) : null;
}

/** Cambia título y etiqueta. Devuelve `false` si la nota no existe. */
export async function actualizarNota(
  db: BaseDatos,
  id: number,
  cambios: CambiosNota,
  ahora: string,
): Promise<boolean> {
  const resultado = await db.runAsync(
    `UPDATE nota_voz SET titulo = ?, etiqueta = ?, updated_at = ?, pending = 1
      WHERE id = ? AND deleted = 0`,
    [cambios.titulo, cambios.etiqueta, ahora, id],
  );
  return resultado.changes > 0;
}

/**
 * Elimina la nota para el usuario y devuelve la ruta del audio que hay que borrar
 * (o `null` si no existe). La fila queda marcada para poder sincronizar el borrado.
 */
export async function eliminarNota(
  db: BaseDatos,
  id: number,
  ahora: string,
): Promise<string | null> {
  let archivoUri: string | null = null;
  await db.withTransactionAsync(async () => {
    const nota = await obtenerNota(db, id);
    if (!nota) {
      return;
    }
    await db.runAsync("UPDATE nota_voz SET deleted = 1, pending = 1, updated_at = ? WHERE id = ?", [
      ahora,
      id,
    ]);
    archivoUri = nota.archivoUri;
  });
  return archivoUri;
}
