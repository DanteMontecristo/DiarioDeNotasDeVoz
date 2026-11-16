import { DURACION_MAXIMA_MS } from "./duracion";

export type Calidad = "alta" | "baja";
export type Ajustes = { calidad: Calidad; limiteMs: number; guardarLugar: boolean };

/** Límites de grabación que se ofrecen; ninguno pasa del máximo de 2 minutos. */
export const LIMITES_MS: readonly number[] = [30_000, 60_000, DURACION_MAXIMA_MS];

export const AJUSTES_POR_DEFECTO: Ajustes = {
  calidad: "alta",
  limiteMs: DURACION_MAXIMA_MS,
  guardarLugar: false,
};

/** Lee los ajustes guardados como texto; un valor ausente o inválido cae en su valor por defecto. */
export function interpretarAjustes(guardados: Record<string, string>): Ajustes {
  const limite = Number(guardados.limite_ms);
  return {
    calidad: guardados.calidad === "baja" ? "baja" : AJUSTES_POR_DEFECTO.calidad,
    limiteMs: LIMITES_MS.includes(limite) ? limite : AJUSTES_POR_DEFECTO.limiteMs,
    guardarLugar: guardados.guardar_lugar === "1",
  };
}

/** Convierte los ajustes que cambian en los pares clave-valor que se guardan. */
export function serializarAjustes(cambios: Partial<Ajustes>): Record<string, string> {
  const pares: Record<string, string> = {};
  if (cambios.calidad !== undefined) {
    pares.calidad = cambios.calidad;
  }
  if (cambios.limiteMs !== undefined) {
    pares.limite_ms = String(cambios.limiteMs);
  }
  if (cambios.guardarLugar !== undefined) {
    pares.guardar_lugar = cambios.guardarLugar ? "1" : "0";
  }
  return pares;
}

export function etiquetaLimite(limiteMs: number): string {
  const segundos = Math.round(limiteMs / 1000);
  if (segundos < 60) {
    return `${segundos} segundos`;
  }
  const minutos = segundos / 60;
  return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
}
