/** Qué tan cerca de 1 g debe estar el eje Z para considerar el teléfono plano. */
const UMBRAL_PLANO = 0.8;

/**
 * Indica si el teléfono está apoyado con la pantalla hacia abajo, a partir del eje Z del
 * acelerómetro (en g). Android e iOS reportan ese eje con signos contrarios.
 */
export function estaBocaAbajo(z: number, plataforma: string): boolean {
  if (plataforma === "android") {
    return z < -UMBRAL_PLANO;
  }
  if (plataforma === "ios") {
    return z > UMBRAL_PLANO;
  }
  return false;
}
