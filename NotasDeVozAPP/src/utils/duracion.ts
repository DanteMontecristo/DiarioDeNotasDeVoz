/** Menos de 1 s se descarta como toque accidental. */
export const DURACION_MINIMA_MS = 1000;
/** Una nota dura como máximo 2 minutos. */
export const DURACION_MAXIMA_MS = 120_000;

const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;

/** Convierte milisegundos en `m:ss` (125000 → «2:05»). Un valor inválido se muestra como cero. */
export function formatearDuracion(ms: number): string {
  const valido = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const segundosTotales = Math.floor(valido / MS_POR_SEGUNDO);
  const minutos = Math.floor(segundosTotales / SEGUNDOS_POR_MINUTO);
  const segundos = segundosTotales % SEGUNDOS_POR_MINUTO;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

/** Una grabación solo se guarda si dura entre 1 s y 120 s. */
export function esDuracionValida(ms: number): boolean {
  return Number.isFinite(ms) && ms >= DURACION_MINIMA_MS && ms <= DURACION_MAXIMA_MS;
}
