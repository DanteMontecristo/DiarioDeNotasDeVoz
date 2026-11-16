import { z } from "zod";
import { iniciarSesion } from "@/lib/auth-rest";
import { manejar } from "@/lib/ruta";
import { leerJson, validar } from "@/lib/validacion";

export const runtime = "nodejs";

// Aquí no se exige el mínimo de 8: una contraseña corta debe dar 401, no pistas.
const esquema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const POST = manejar(async (peticion) => {
  const datos = validar(esquema, await leerJson(peticion));
  const sesion = await iniciarSesion(datos.email, datos.password);
  return Response.json(sesion);
});
