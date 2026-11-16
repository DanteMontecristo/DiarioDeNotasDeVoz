import { respuestaError } from "./errores";

type Manejador = (peticion: Request) => Promise<Response>;

/** Envuelve una ruta para que todo error salga con el formato único de la API. */
export function manejar(manejador: Manejador): Manejador {
  return async (peticion) => {
    try {
      return await manejador(peticion);
    } catch (error) {
      return respuestaError(error);
    }
  };
}
