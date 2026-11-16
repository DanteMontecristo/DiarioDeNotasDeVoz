import { ErrorApi, respuestaError } from "./errores";
import { registrarErrorInterno } from "./registro";

type Manejador = (peticion: Request) => Promise<Response>;
type ContextoRuta<P> = { params: Promise<P> };

/** Responde con el formato único; los errores no previstos además quedan en el log. */
function responderError(error: unknown, peticion: Request): Response {
  if (!(error instanceof ErrorApi)) {
    registrarErrorInterno(error, peticion);
  }
  return respuestaError(error);
}

/** Envuelve una ruta para que todo error salga con el formato único de la API. */
export function manejar(manejador: Manejador): Manejador {
  return async (peticion) => {
    try {
      return await manejador(peticion);
    } catch (error) {
      return responderError(error, peticion);
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
      return responderError(error, peticion);
    }
  };
}
