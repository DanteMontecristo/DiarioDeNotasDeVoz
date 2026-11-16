export const VELOCIDADES: readonly number[] = [1, 1.5, 2];
export const SALTO_MS = 10_000;

export type Direccion = "adelante" | "atras";

function recortar(valor: number, maximo: number): number {
  return Math.min(Math.max(valor, 0), Math.max(maximo, 0));
}

/** Recorre 1× → 1,5× → 2× → 1×. */
export function siguienteVelocidad(actual: number): number {
  const indice = VELOCIDADES.indexOf(actual);
  return VELOCIDADES[(indice + 1) % VELOCIDADES.length] ?? 1;
}

export function etiquetaVelocidad(velocidad: number): string {
  return `${String(velocidad).replace(".", ",")}×`;
}

/** Nueva posición al avanzar o retroceder 10 s, sin salirse de la nota. */
export function posicionConSalto(posicionMs: number, duracionMs: number, direccion: Direccion) {
  const salto = direccion === "adelante" ? SALTO_MS : -SALTO_MS;
  return recortar(posicionMs + salto, duracionMs);
}

/** Posición de la nota que corresponde al punto `x` tocado en una barra de `ancho` píxeles. */
export function posicionDesdeBarra(x: number, ancho: number, duracionMs: number): number {
  if (ancho <= 0) {
    return 0;
  }
  return recortar(Math.round((x / ancho) * duracionMs), duracionMs);
}

/** Doble toque: la mitad izquierda retrocede, la derecha avanza. */
export function direccionDelToque(x: number, ancho: number): Direccion {
  return x < ancho / 2 ? "atras" : "adelante";
}
