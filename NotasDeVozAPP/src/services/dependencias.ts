import { randomUUID } from "expo-crypto";
import { obtenerBaseDatos } from "@/db/conexion";
import { almacenAudio } from "./almacenAudio";
import type { DependenciasNotas } from "./notasServicio";

/** Las dependencias reales del servicio de notas, tal como corren en el teléfono. */
export async function obtenerDependencias(): Promise<DependenciasNotas> {
  return {
    db: await obtenerBaseDatos(),
    almacen: almacenAudio,
    generarId: randomUUID,
    ahora: () => new Date(),
  };
}
