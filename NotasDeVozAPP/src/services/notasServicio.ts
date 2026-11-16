import type { BaseDatos } from "@/db/tipos";
import {
  actualizarNota,
  eliminarNota,
  insertarNota,
  listarNotas,
  type Nota,
  obtenerNota,
} from "@/repositories/notasRepositorio";
import { DURACION_MAXIMA_MS, esDuracionValida } from "@/utils/duracion";
import { resolverEtiqueta } from "@/utils/etiqueta";
import { resolverTitulo } from "@/utils/titulo";
import type { AlmacenAudio } from "./almacenAudio";

export type DependenciasNotas = {
  db: BaseDatos;
  almacen: AlmacenAudio;
  generarId: () => string;
  ahora: () => Date;
};

export type GrabacionTerminada = {
  uriTemporal: string;
  duracionMs: number;
  titulo: string;
  etiqueta: string | null;
  lugar: { lat: number; lng: number } | null;
};

export type ResultadoGuardar = { ok: true; nota: Nota } | { ok: false; error: string };
export type ResultadoCambio = { ok: true } | { ok: false; error: string };
type Textos = { ok: true; titulo: string; etiqueta: string | null } | { ok: false; error: string };

const EXTENSION_POR_DEFECTO = "m4a";

function extensionDe(uri: string): string {
  return /\.([a-z0-9]{1,5})$/i.exec(uri)?.[1]?.toLowerCase() ?? EXTENSION_POR_DEFECTO;
}

function resolverTextos(titulo: string, etiqueta: string | null, fecha: Date): Textos {
  const tituloResuelto = resolverTitulo(titulo, fecha);
  if (!tituloResuelto.ok) {
    return tituloResuelto;
  }
  const etiquetaResuelta = resolverEtiqueta(etiqueta);
  if (!etiquetaResuelta.ok) {
    return etiquetaResuelta;
  }
  return { ok: true, titulo: tituloResuelto.titulo, etiqueta: etiquetaResuelta.etiqueta };
}

/**
 * Convierte una grabación terminada en una nota: valida, mueve el audio a un lugar
 * persistente y guarda la fila. Menos de 1 s se descarta como toque accidental.
 */
export async function guardarGrabacion(
  deps: DependenciasNotas,
  grabacion: GrabacionTerminada,
): Promise<ResultadoGuardar> {
  // El límite de 2 minutos detiene la grabación con un temporizador: puede pasarse unos ms.
  const duracionMs = Math.min(grabacion.duracionMs, DURACION_MAXIMA_MS);
  if (!esDuracionValida(duracionMs)) {
    await deps.almacen.borrar(grabacion.uriTemporal);
    return { ok: false, error: "La grabación duró menos de 1 segundo y se descartó." };
  }
  const fecha = deps.ahora();
  const textos = resolverTextos(grabacion.titulo, grabacion.etiqueta, fecha);
  if (!textos.ok) {
    return textos;
  }
  const remoteId = deps.generarId();
  const nombre = `${remoteId}.${extensionDe(grabacion.uriTemporal)}`;
  const archivoUri = await deps.almacen.guardar(grabacion.uriTemporal, nombre);
  try {
    const nota = await insertarNota(deps.db, {
      titulo: textos.titulo,
      etiqueta: textos.etiqueta,
      archivoUri,
      duracionMs,
      lat: grabacion.lugar?.lat ?? null,
      lng: grabacion.lugar?.lng ?? null,
      creadaEn: fecha.toISOString(),
      remoteId,
    });
    return { ok: true, nota };
  } catch (error) {
    await deps.almacen.borrar(archivoUri);
    throw error;
  }
}

/** Elimina la nota y su archivo de audio. Devuelve `false` si la nota no existe. */
export async function eliminarNotaConArchivo(
  deps: DependenciasNotas,
  id: number,
): Promise<boolean> {
  const archivoUri = await eliminarNota(deps.db, id, deps.ahora().toISOString());
  if (archivoUri === null) {
    return false;
  }
  // Si el archivo ya no está o no se deja borrar, la nota igual queda eliminada.
  await deps.almacen.borrar(archivoUri).catch(() => undefined);
  return true;
}

export async function renombrarNota(
  deps: DependenciasNotas,
  id: number,
  cambios: { titulo: string; etiqueta: string | null },
): Promise<ResultadoCambio> {
  const fecha = deps.ahora();
  const textos = resolverTextos(cambios.titulo, cambios.etiqueta, fecha);
  if (!textos.ok) {
    return textos;
  }
  const { titulo, etiqueta } = textos;
  const cambio = await actualizarNota(deps.db, id, { titulo, etiqueta }, fecha.toISOString());
  return cambio ? { ok: true } : { ok: false, error: "La nota ya no existe." };
}

/** Notas vigentes, de la más reciente a la más antigua, filtradas por título o etiqueta. */
export function buscarNotas(deps: DependenciasNotas, busqueda: string): Promise<Nota[]> {
  return listarNotas(deps.db, busqueda);
}

export function obtenerNotaPorId(deps: DependenciasNotas, id: number): Promise<Nota | null> {
  return obtenerNota(deps.db, id);
}
