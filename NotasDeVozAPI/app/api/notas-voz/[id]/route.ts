import { ErrorApi } from "@/lib/errores";
import { esquemaDatosNota, esquemaIdNota } from "@/lib/notas-voz/esquema";
import { borrar, guardar } from "@/lib/notas-voz/repositorio";
import { manejarConParams } from "@/lib/ruta";
import { exigirUsuario } from "@/lib/sesion";
import { leerJson, validar } from "@/lib/validacion";

export const runtime = "nodejs";

type Params = { id: string };

export const PUT = manejarConParams<Params>(async (peticion, params) => {
  const usuario = await exigirUsuario(peticion);
  const { id } = validar(esquemaIdNota, params);
  const datos = validar(esquemaDatosNota, await leerJson(peticion));
  const nota = await guardar(usuario.id, id, datos, new Date().toISOString());
  return Response.json(nota);
});

export const DELETE = manejarConParams<Params>(async (peticion, params) => {
  const usuario = await exigirUsuario(peticion);
  const { id } = validar(esquemaIdNota, params);
  const existia = await borrar(usuario.id, id, new Date().toISOString());
  if (!existia) {
    throw new ErrorApi(404, "La nota no existe");
  }
  return Response.json({ ok: true });
});
