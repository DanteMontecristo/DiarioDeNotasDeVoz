import { type Cliente, ErrorCliente, esObjeto } from "@/api/clienteHttp";
import type { BaseDatos } from "@/db/tipos";
import { guardarAjustes, leerAjustes } from "@/repositories/ajustesRepositorio";
import {
  aplicarRemota,
  listarPendientes,
  marcarSincronizada,
  type NotaPendiente,
  type NotaRemota,
  purgarNota,
} from "@/repositories/notasRepositorio";

export type DependenciasSincronizacion = {
  db: BaseDatos;
  cliente: Pick<Cliente, "privada">;
  borrarAudio: (uri: string) => Promise<void>;
  /** Cada usuario lleva su propio punto de partida para pedir cambios. */
  usuarioId: string;
};

export type ResultadoSincronizacion =
  | { ok: true; enviadas: number; recibidas: number; rechazadas: number }
  | { ok: false; error: string };

const RUTA = "/api/notas-voz";
const TAMANO_PAGINA = 500;

function tieneEstado(error: unknown, status: number): boolean {
  return error instanceof ErrorCliente && error.status === status;
}

function textoONulo(valor: unknown): valor is string | null {
  return typeof valor === "string" || valor === null;
}

function numeroONulo(valor: unknown): valor is number | null {
  return typeof valor === "number" || valor === null;
}

/** Convierte un elemento de la API en una nota remota, o `null` si no tiene la forma esperada. */
function aRemota(item: unknown): NotaRemota | null {
  if (!esObjeto(item)) {
    return null;
  }
  const { id, titulo, duracion_ms, etiqueta, lat, lng, grabada_en, updated_at, deleted_at } = item;
  const textos = [id, titulo, grabada_en, updated_at].every((valor) => typeof valor === "string");
  if (!textos || typeof duracion_ms !== "number") {
    return null;
  }
  if (!textoONulo(etiqueta) || !numeroONulo(lat) || !numeroONulo(lng)) {
    return null;
  }
  return {
    remoteId: String(id),
    titulo: String(titulo),
    duracionMs: duracion_ms,
    etiqueta,
    lat,
    lng,
    creadaEn: String(grabada_en),
    updatedAt: String(updated_at),
    eliminada: deleted_at !== null && deleted_at !== undefined,
  };
}

async function enviarBorrado(deps: DependenciasSincronizacion, nota: NotaPendiente) {
  try {
    await deps.cliente.privada("DELETE", `${RUTA}/${nota.remoteId}`, undefined);
  } catch (error) {
    // 404: el servidor nunca tuvo esa nota, así que el borrado ya está «hecho».
    if (!tieneEstado(error, 404)) {
      throw error;
    }
  }
  await purgarNota(deps.db, nota.id);
}

async function enviarCambio(deps: DependenciasSincronizacion, nota: NotaPendiente) {
  const respuesta = await deps.cliente.privada("PUT", `${RUTA}/${nota.remoteId}`, {
    titulo: nota.titulo,
    duracion_ms: nota.duracionMs,
    etiqueta: nota.etiqueta,
    lat: nota.lat,
    lng: nota.lng,
    grabada_en: nota.creadaEn,
  });
  const delServidor = esObjeto(respuesta) ? respuesta.updated_at : undefined;
  const updatedAt = typeof delServidor === "string" ? delServidor : nota.updatedAt;
  await marcarSincronizada(deps.db, nota.id, nota.updatedAt, updatedAt);
}

/** Sube lo pendiente. Una nota que el servidor rechaza por inválida no detiene a las demás. */
async function enviarPendientes(deps: DependenciasSincronizacion) {
  let enviadas = 0;
  let rechazadas = 0;
  for (const nota of await listarPendientes(deps.db)) {
    try {
      await (nota.eliminada ? enviarBorrado(deps, nota) : enviarCambio(deps, nota));
      enviadas += 1;
    } catch (error) {
      if (!tieneEstado(error, 400)) {
        throw error;
      }
      rechazadas += 1;
    }
  }
  return { enviadas, rechazadas };
}

async function aplicarPagina(deps: DependenciasSincronizacion, items: unknown[]) {
  let recibidas = 0;
  let ultima: string | null = null;
  for (const nota of items.map(aRemota)) {
    if (!nota) {
      continue;
    }
    const { aplicada, audioHuerfano } = await aplicarRemota(deps.db, nota);
    recibidas += aplicada ? 1 : 0;
    ultima = nota.updatedAt;
    if (audioHuerfano) {
      await deps.borrarAudio(audioHuerfano).catch(() => undefined);
    }
  }
  return { recibidas, ultima };
}

/** Trae los cambios posteriores al último recibido, página por página. */
async function traerCambios(deps: DependenciasSincronizacion): Promise<number> {
  const clave = `sync_desde:${deps.usuarioId}`;
  let desde = (await leerAjustes(deps.db))[clave] ?? null;
  let recibidas = 0;
  let completa = true;
  while (completa) {
    const ruta = desde ? `${RUTA}?since=${encodeURIComponent(desde)}` : RUTA;
    const respuesta = await deps.cliente.privada("GET", ruta);
    const items = esObjeto(respuesta) && Array.isArray(respuesta.items) ? respuesta.items : [];
    const pagina = await aplicarPagina(deps, items);
    recibidas += pagina.recibidas;
    if (pagina.ultima) {
      desde = pagina.ultima;
      await guardarAjustes(deps.db, { [clave]: desde });
    }
    completa = items.length >= TAMANO_PAGINA && pagina.ultima !== null;
  }
  return recibidas;
}

/**
 * Sincroniza con la API: primero envía lo pendiente y luego trae los cambios.
 * Si dos dispositivos cambian la misma nota, gana la última escritura que llegó al servidor.
 */
export async function sincronizar(
  deps: DependenciasSincronizacion,
): Promise<ResultadoSincronizacion> {
  try {
    const { enviadas, rechazadas } = await enviarPendientes(deps);
    const recibidas = await traerCambios(deps);
    return { ok: true, enviadas, recibidas, rechazadas };
  } catch (error) {
    const conocido = error instanceof ErrorCliente;
    return {
      ok: false,
      error: conocido ? error.message : "No se pudo sincronizar. Inténtalo de nuevo.",
    };
  }
}
