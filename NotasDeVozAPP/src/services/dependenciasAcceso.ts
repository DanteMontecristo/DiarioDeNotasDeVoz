import { type Cliente, crearCliente } from "@/api/clienteHttp";
import { urlApi } from "@/api/config";
import { sesionAlmacen } from "@/api/sesionAlmacen";
import type { DependenciasAcceso } from "./accesoServicio";

export type Conexion = DependenciasAcceso & { cliente: Cliente };

let conexion: Conexion | null = null;

/**
 * Cliente de la API y almacén de la sesión, tal como corren en el teléfono.
 * Lanza un error claro si falta configurar la URL de la API.
 */
export function obtenerConexion(): Conexion {
  conexion ??= {
    cliente: crearCliente({ urlBase: urlApi(), almacen: sesionAlmacen }),
    almacen: sesionAlmacen,
  };
  return conexion;
}
