import { obtenerDependencias } from "./dependencias";
import { obtenerConexion } from "./dependenciasAcceso";
import { type ResultadoSincronizacion, sincronizar } from "./sincronizacionServicio";

/** La sincronización automática no se repite antes de este tiempo. */
const INTERVALO_MINIMO_MS = 30_000;

let ultimoIntento = 0;

/** Sincroniza con las dependencias reales del teléfono. Requiere sesión iniciada. */
export async function sincronizarAhora(): Promise<ResultadoSincronizacion> {
  try {
    const { cliente, almacen } = obtenerConexion();
    const sesion = await almacen.leer();
    if (!sesion) {
      return { ok: false, error: "Inicia sesión para sincronizar." };
    }
    const { db, almacen: audios } = await obtenerDependencias();
    return await sincronizar({
      db,
      cliente,
      borrarAudio: (uri) => audios.borrar(uri),
      usuarioId: sesion.usuario.id,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo sincronizar.";
    return { ok: false, error: mensaje };
  }
}

/**
 * Sincronización silenciosa, para lanzar al abrir la lista. Devuelve `true` solo si
 * llegaron notas nuevas, para que la pantalla sepa que debe recargar.
 */
export async function sincronizarEnSegundoPlano(ahoraMs: number): Promise<boolean> {
  if (ahoraMs - ultimoIntento < INTERVALO_MINIMO_MS) {
    return false;
  }
  ultimoIntento = ahoraMs;
  const resultado = await sincronizarAhora();
  return resultado.ok && resultado.recibidas > 0;
}
