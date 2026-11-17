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

// ---------- Sincronización con la API ----------

export type NotaPendiente = Nota & { eliminada: boolean };

/** Lo que la API guarda de una nota, ya con los nombres que usa la app. */
export type NotaRemota = {
  remoteId: string;
  titulo: string;
  duracionMs: number;
  etiqueta: string | null;
  lat: number | null;
  lng: number | null;
  creadaEn: string;
  updatedAt: string;
  eliminada: boolean;
};

export type ResultadoRemota = { aplicada: boolean; audioHuerfano: string | null };

/** Notas con cambios sin enviar, incluidas las eliminadas en el teléfono. */
export async function listarPendientes(db: BaseDatos): Promise<NotaPendiente[]> {
  const filas = await db.getAllAsync("SELECT * FROM nota_voz WHERE pending = 1 ORDER BY id", []);
  return filas.map((fila) => ({ ...aNota(fila), eliminada: numero(fila, "deleted") === 1 }));
}

/**
 * Marca la nota como enviada. Solo aplica si no cambió desde que se envió
 * (`enviadaCon` es su `updated_at` de ese momento); si cambió, sigue pendiente.
 */
export async function marcarSincronizada(
  db: BaseDatos,
  id: number,
  enviadaCon: string,
  updatedAtServidor: string,
): Promise<void> {
  await db.runAsync(
    "UPDATE nota_voz SET pending = 0, updated_at = ? WHERE id = ? AND updated_at = ?",
    [updatedAtServidor, id, enviadaCon],
  );
}

/** Quita definitivamente una fila cuyo borrado ya conoce el servidor. */
export async function purgarNota(db: BaseDatos, id: number): Promise<void> {
  await db.runAsync("DELETE FROM nota_voz WHERE id = ?", [id]);
}

async function insertarRemota(db: BaseDatos, nota: NotaRemota): Promise<void> {
  // Sin audio: el archivo se quedó en el dispositivo donde se grabó.
  await db.runAsync(
    `INSERT INTO nota_voz
       (titulo, archivo_uri, duracion_ms, etiqueta, lat, lng, creada_en, remote_id, updated_at)
     VALUES (?, '', ?, ?, ?, ?, ?, ?, ?)`,
    [
      nota.titulo,
      nota.duracionMs,
      nota.etiqueta,
      nota.lat,
      nota.lng,
      nota.creadaEn,
      nota.remoteId,
      nota.updatedAt,
    ],
  );
}

async function actualizarConRemota(db: BaseDatos, nota: NotaRemota): Promise<void> {
  await db.runAsync(
    `UPDATE nota_voz
        SET titulo = ?, duracion_ms = ?, etiqueta = ?, lat = ?, lng = ?, creada_en = ?, updated_at = ?
      WHERE remote_id = ?`,
    [
      nota.titulo,
      nota.duracionMs,
      nota.etiqueta,
      nota.lat,
      nota.lng,
      nota.creadaEn,
      nota.updatedAt,
      nota.remoteId,
    ],
  );
}

async function aplicarSobreFila(
  db: BaseDatos,
  fila: Fila | null,
  nota: NotaRemota,
): Promise<ResultadoRemota> {
  if (!fila) {
    if (!nota.eliminada) {
      await insertarRemota(db, nota);
    }
    return { aplicada: true, audioHuerfano: null };
  }
  if (numero(fila, "pending") === 1) {
    // Hay un cambio local sin enviar: se envía primero y no se pisa.
    return { aplicada: false, audioHuerfano: null };
  }
  if (nota.eliminada) {
    await purgarNota(db, numero(fila, "id"));
    return { aplicada: true, audioHuerfano: texto(fila, "archivo_uri") || null };
  }
  await actualizarConRemota(db, nota);
  return { aplicada: true, audioHuerfano: null };
}

/** Aplica en el teléfono un cambio que llegó de la API (crear, actualizar o eliminar). */
export async function aplicarRemota(db: BaseDatos, nota: NotaRemota): Promise<ResultadoRemota> {
  let resultado: ResultadoRemota = { aplicada: false, audioHuerfano: null };
  await db.withTransactionAsync(async () => {
    const fila = await db.getFirstAsync("SELECT * FROM nota_voz WHERE remote_id = ?", [
      nota.remoteId,
    ]);
    resultado = await aplicarSobreFila(db, fila, nota);
  });
  return resultado;
}
