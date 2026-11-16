import { z } from "zod";

const esquemaEntorno = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
});

export type Entorno = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  webApiKey: string;
};

type Variables = Record<string, string | undefined>;

/**
 * Lee y valida las variables de entorno de la API.
 * El mensaje de error nombra las variables que faltan, pero nunca sus valores.
 */
export function leerEntorno(variables: Variables = process.env): Entorno {
  const resultado = esquemaEntorno.safeParse(variables);
  if (!resultado.success) {
    const faltantes = resultado.error.issues.map((problema) => problema.path.join("."));
    throw new Error(`Variables de entorno faltantes o vacías: ${faltantes.join(", ")}`);
  }
  const datos = resultado.data;
  return {
    projectId: datos.FIREBASE_PROJECT_ID,
    clientEmail: datos.FIREBASE_CLIENT_EMAIL,
    // En Vercel la clave se pega con "\n" literales: aquí vuelven a ser saltos de línea.
    privateKey: datos.FIREBASE_PRIVATE_KEY.replaceAll("\\n", "\n"),
    webApiKey: datos.FIREBASE_WEB_API_KEY,
  };
}
