import { openDatabaseAsync } from "expo-sqlite";
import { migrar } from "./migraciones";
import type { BaseDatos } from "./tipos";

const NOMBRE_BASE = "notas-de-voz.db";

let conexion: Promise<BaseDatos> | null = null;

async function abrir(): Promise<BaseDatos> {
  const db = await openDatabaseAsync(NOMBRE_BASE);
  await migrar(db);
  return db;
}

/** Base de datos de la app, abierta y migrada una sola vez. */
export function obtenerBaseDatos(): Promise<BaseDatos> {
  conexion ??= abrir().catch((error: unknown) => {
    // Si falló, no se guarda el error: el próximo intento vuelve a abrir.
    conexion = null;
    throw error;
  });
  return conexion;
}
