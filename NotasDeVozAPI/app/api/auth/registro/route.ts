import { z } from "zod";
import { registrar } from "@/lib/auth-rest";
import { manejar } from "@/lib/ruta";
import { leerJson, validar } from "@/lib/validacion";

export const runtime = "nodejs";

const esquema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export const POST = manejar(async (peticion) => {
  const datos = validar(esquema, await leerJson(peticion));
  const sesion = await registrar(datos.email, datos.password);
  return Response.json(sesion, { status: 201 });
});
