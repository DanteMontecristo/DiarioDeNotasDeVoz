import { manejar } from "@/lib/ruta";
import { exigirUsuario } from "@/lib/sesion";

export const runtime = "nodejs";

export const GET = manejar(async (peticion) => {
  const usuario = await exigirUsuario(peticion);
  return Response.json({ usuario });
});
