import { z } from "zod";
import { renovar } from "@/lib/auth-rest";
import { manejar } from "@/lib/ruta";
import { leerJson, validar } from "@/lib/validacion";

export const runtime = "nodejs";

const esquema = z.object({ refreshToken: z.string().min(1).max(4096) });

export const POST = manejar(async (peticion) => {
  const datos = validar(esquema, await leerJson(peticion));
  return Response.json(await renovar(datos.refreshToken));
});
