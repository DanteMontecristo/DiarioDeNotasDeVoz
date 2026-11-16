import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { leerEntorno } from "./entorno";

/** Inicia Firebase Admin una sola vez y reutiliza la app en las demás llamadas. */
function obtenerApp(): App {
  const existente = getApps()[0];
  if (existente) {
    return existente;
  }
  const { projectId, clientEmail, privateKey } = leerEntorno();
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function obtenerAuth(): Auth {
  return getAuth(obtenerApp());
}

export function obtenerDb(): Firestore {
  return getFirestore(obtenerApp());
}
