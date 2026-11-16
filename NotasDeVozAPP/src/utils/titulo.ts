export const LONGITUD_MAXIMA_TITULO = 60;

export type ResultadoTitulo = { ok: true; titulo: string } | { ok: false; error: string };

function dosCifras(valor: number): string {
  return String(valor).padStart(2, "0");
}

/** Título que se usa cuando el usuario no escribe ninguno: «Nota del dd/mm/aaaa». */
export function tituloPorDefecto(fecha: Date): string {
  const dia = dosCifras(fecha.getDate());
  const mes = dosCifras(fecha.getMonth() + 1);
  return `Nota del ${dia}/${mes}/${fecha.getFullYear()}`;
}

/**
 * Aplica las reglas del título: de 1 a 60 caracteres sin contar los espacios de los
 * extremos; si queda vacío se reemplaza por el título por defecto de esa fecha.
 */
export function resolverTitulo(entrada: string, fecha: Date): ResultadoTitulo {
  const titulo = entrada.trim();
  if (titulo.length === 0) {
    return { ok: true, titulo: tituloPorDefecto(fecha) };
  }
  if (titulo.length > LONGITUD_MAXIMA_TITULO) {
    return {
      ok: false,
      error: `El título puede tener máximo ${LONGITUD_MAXIMA_TITULO} caracteres.`,
    };
  }
  return { ok: true, titulo };
}
