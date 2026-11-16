const MS_POR_MINUTO = 60_000;
const MS_POR_DIA = 86_400_000;
const DIAS_POR_SEMANA = 7;

export type RangoSemana = { inicio: string; fin: string; dias: string[] };
export type DiaResumen = { fecha: string; minutos: number; notas: number };
export type ResumenSemana = { dias: DiaResumen[]; total_minutos: number };
type Grabacion = { grabada_en: string; duracion_ms: number };

/** Fecha `YYYY-MM-DD` de un instante, vista en la hora local del usuario. */
function fechaLocal(instanteMs: number, desfaseMin: number): string {
  return new Date(instanteMs + desfaseMin * MS_POR_MINUTO).toISOString().slice(0, 10);
}

function aMinutos(duracionMs: number): number {
  return Math.round((duracionMs / MS_POR_MINUTO) * 100) / 100;
}

/** Fecha local de hoy: la semana que se usa cuando el cliente no envía `semana`. */
export function semanaActual(ahoraMs: number, desfaseMin: number): string {
  return fechaLocal(ahoraMs, desfaseMin);
}

/**
 * Semana (lunes a domingo) que contiene `fecha`. `inicio` y `fin` son instantes UTC:
 * `desfaseMin` son los minutos que la hora local del usuario le lleva a UTC (Bogotá: -300).
 */
export function rangoSemana(fecha: string, desfaseMin: number): RangoSemana {
  const dia = Date.parse(`${fecha}T00:00:00.000Z`);
  const desdeElLunes = (new Date(dia).getUTCDay() + 6) % DIAS_POR_SEMANA;
  const lunes = dia - desdeElLunes * MS_POR_DIA;
  const aUtc = desfaseMin * MS_POR_MINUTO;
  return {
    inicio: new Date(lunes - aUtc).toISOString(),
    fin: new Date(lunes + DIAS_POR_SEMANA * MS_POR_DIA - aUtc).toISOString(),
    dias: Array.from({ length: DIAS_POR_SEMANA }, (_, indice) =>
      fechaLocal(lunes + indice * MS_POR_DIA, 0),
    ),
  };
}

/** Minutos grabados y número de notas por cada día de la semana. */
export function resumirSemana(
  notas: readonly Grabacion[],
  rango: RangoSemana,
  desfaseMin: number,
): ResumenSemana {
  const msPorDia = new Map(rango.dias.map((fecha) => [fecha, { ms: 0, notas: 0 }]));
  for (const nota of notas) {
    const dia = msPorDia.get(fechaLocal(Date.parse(nota.grabada_en), desfaseMin));
    if (dia) {
      dia.ms += nota.duracion_ms;
      dia.notas += 1;
    }
  }
  const acumulados = [...msPorDia.entries()];
  const totalMs = acumulados.reduce((suma, [, dia]) => suma + dia.ms, 0);
  return {
    dias: acumulados.map(([fecha, dia]) => ({
      fecha,
      minutos: aMinutos(dia.ms),
      notas: dia.notas,
    })),
    total_minutos: aMinutos(totalMs),
  };
}
