import type { BaseDatos } from "@/db/tipos";
import { guardarAjustes, leerAjustes } from "@/repositories/ajustesRepositorio";
import { type Ajustes, interpretarAjustes, serializarAjustes } from "@/utils/ajustes";

type Dependencias = { db: BaseDatos };

export async function obtenerAjustes({ db }: Dependencias): Promise<Ajustes> {
  return interpretarAjustes(await leerAjustes(db));
}

/** Guarda solo lo que cambia y devuelve los ajustes completos ya actualizados. */
export async function cambiarAjustes(
  deps: Dependencias,
  cambios: Partial<Ajustes>,
): Promise<Ajustes> {
  await guardarAjustes(deps.db, serializarAjustes(cambios));
  return obtenerAjustes(deps);
}
