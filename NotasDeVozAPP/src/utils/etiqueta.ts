/** El mismo límite que valida la API. */
export const LONGITUD_MAXIMA_ETIQUETA = 30;

export type ResultadoEtiqueta =
  { ok: true; etiqueta: string | null } | { ok: false; error: string };

/** La etiqueta es opcional: vacía se guarda como `null`; con texto, máximo 30 caracteres. */
export function resolverEtiqueta(entrada: string | null): ResultadoEtiqueta {
  const etiqueta = (entrada ?? "").trim();
  if (etiqueta.length === 0) {
    return { ok: true, etiqueta: null };
  }
  if (etiqueta.length > LONGITUD_MAXIMA_ETIQUETA) {
    return {
      ok: false,
      error: `La etiqueta puede tener máximo ${LONGITUD_MAXIMA_ETIQUETA} caracteres.`,
    };
  }
  return { ok: true, etiqueta };
}
