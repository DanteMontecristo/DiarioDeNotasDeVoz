import { z } from "zod";
import { listarGrabadasEntre } from "@/lib/notas-voz/repositorio";
import { rangoSemana, resumirSemana, semanaActual } from "@/lib/notas-voz/resumen";
import { manejar } from "@/lib/ruta";
import { exigirUsuario } from "@/lib/sesion";
import { validar } from "@/lib/validacion";

export const runtime = "nodejs";

// UTC-14:00 a UTC+14:00, los desfases horarios que existen.
const DESFASE_MAXIMO_MIN = 840;

const esquemaConsulta = z.object({
  semana: z.iso.date().optional(),
  desfase_min: z.coerce.number().int().min(-DESFASE_MAXIMO_MIN).max(DESFASE_MAXIMO_MIN).default(0),
});

export const GET = manejar(async (peticion) => {
  const usuario = await exigirUsuario(peticion);
  const parametros = new URL(peticion.url).searchParams;
  const consulta = validar(esquemaConsulta, {
    semana: parametros.get("semana") ?? undefined,
    desfase_min: parametros.get("desfase_min") ?? undefined,
  });
  const desfase = consulta.desfase_min;
  const rango = rangoSemana(consulta.semana ?? semanaActual(Date.now(), desfase), desfase);
  const notas = await listarGrabadasEntre(usuario.id, rango.inicio, rango.fin);
  const semana = { inicio: rango.dias[0], fin: rango.dias[rango.dias.length - 1] };
  return Response.json({ semana, ...resumirSemana(notas, rango, desfase) });
});
