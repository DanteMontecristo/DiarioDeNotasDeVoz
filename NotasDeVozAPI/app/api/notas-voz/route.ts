import { z } from "zod";
import { listarDesde } from "@/lib/notas-voz/repositorio";
import { manejar } from "@/lib/ruta";
import { exigirUsuario } from "@/lib/sesion";
import { validar } from "@/lib/validacion";

export const runtime = "nodejs";

const esquemaConsulta = z.object({ since: z.iso.datetime().optional() });

export const GET = manejar(async (peticion) => {
  const usuario = await exigirUsuario(peticion);
  const since = new URL(peticion.url).searchParams.get("since") ?? undefined;
  const consulta = validar(esquemaConsulta, { since });
  const servidor_ahora = new Date().toISOString();
  // Se normaliza a ISO UTC con milisegundos: así se guarda updated_at y se compara como texto.
  const desde = consulta.since ? new Date(consulta.since).toISOString() : null;
  const items = await listarDesde(usuario.id, desde);
  return Response.json({ items, servidor_ahora });
});
