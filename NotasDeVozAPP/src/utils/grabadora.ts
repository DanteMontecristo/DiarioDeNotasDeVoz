/** Por debajo de este nivel el medidor se muestra vacío. */
const DECIBELES_MINIMOS = -60;

/** Cuánto hay que deslizar el dedo a la izquierda para cancelar la grabación. */
export const UMBRAL_CANCELAR_PX = 80;

/** Convierte la medición del micrófono (dB, de -60 a 0) en un nivel de 0 a 1. */
export function nivelDesdeMedidor(decibeles: number | undefined): number {
  if (decibeles === undefined || Number.isNaN(decibeles)) {
    return 0;
  }
  const nivel = (decibeles - DECIBELES_MINIMOS) / -DECIBELES_MINIMOS;
  return Math.min(1, Math.max(0, nivel));
}

/** `desplazamientoX` es negativo cuando el dedo se mueve hacia la izquierda. */
export function debeCancelar(desplazamientoX: number): boolean {
  return desplazamientoX <= -UMBRAL_CANCELAR_PX;
}
