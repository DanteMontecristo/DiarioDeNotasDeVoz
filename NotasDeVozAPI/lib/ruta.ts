import { respuestaError } from "./errores";

type Manejador = (peticion: Request) => Promise<Response>;
type ContextoRuta<P> = { params: Promise<P> };

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

/** Igual que `manejar`, para rutas dinámicas: entrega los parámetros ya resueltos. */
export function manejarConParams<P>(
  manejador: (peticion: Request, params: P) => Promise<Response>,
): (peticion: Request, contexto: ContextoRuta<P>) => Promise<Response> {
  return async (peticion, contexto) => {
    try {
      return await manejador(peticion, await contexto.params);
    } catch (error) {
      return respuestaError(error);
    }
  };
}
