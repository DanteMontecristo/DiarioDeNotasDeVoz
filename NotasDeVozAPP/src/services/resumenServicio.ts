import { type Cliente, ErrorCliente, esObjeto } from "@/api/clienteHttp";

export type DiaResumen = { fecha: string; minutos: number; notas: number };
export type Resumen = { inicio: string; fin: string; dias: DiaResumen[]; totalMinutos: number };
export type ResultadoResumen = { ok: true; resumen: Resumen } | { ok: false; error: string };

function esDia(valor: unknown): valor is DiaResumen {
  return (
    esObjeto(valor) &&
    typeof valor.fecha === "string" &&
    typeof valor.minutos === "number" &&
    typeof valor.notas === "number"
  );
}

function aResumen(respuesta: unknown): Resumen | null {
  if (!esObjeto(respuesta) || !esObjeto(respuesta.semana) || !Array.isArray(respuesta.dias)) {
    return null;
  }
  const { inicio, fin } = respuesta.semana;
  const total = respuesta.total_minutos;
  if (typeof inicio !== "string" || typeof fin !== "string" || typeof total !== "number") {
    return null;
  }
  return { inicio, fin, dias: respuesta.dias.filter(esDia), totalMinutos: total };
}

/**
 * Minutos grabados por día en la semana actual, calculados por el servidor.
 * `desfaseMin` son los minutos que la hora local le lleva a UTC (Colombia: -300).
 */
export async function obtenerResumen(
  cliente: Pick<Cliente, "privada">,
  desfaseMin: number,
): Promise<ResultadoResumen> {
  try {
    const ruta = `/api/notas-voz/resumen?desfase_min=${desfaseMin}`;
    const resumen = aResumen(await cliente.privada("GET", ruta));
    return resumen
      ? { ok: true, resumen }
      : { ok: false, error: "El servidor respondió algo inesperado." };
  } catch (error) {
    const conocido = error instanceof ErrorCliente;
    return { ok: false, error: conocido ? error.message : "No se pudo cargar el resumen." };
  }
}
