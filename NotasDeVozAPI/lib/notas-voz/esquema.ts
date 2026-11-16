import { z } from "zod";

/** Campos que decide el cliente; los nombres coinciden con las columnas de SQLite. */
const camposNota = z.object({
  titulo: z.string().trim().min(1).max(60),
  duracion_ms: z.number().int().min(1000).max(120000),
  etiqueta: z.string().trim().min(1).max(30).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  // Se normaliza a ISO UTC con milisegundos para poder comparar las fechas como texto.
  grabada_en: z.iso.datetime().transform((fecha) => new Date(fecha).toISOString()),
});

/** Lo que acepta `PUT`: los campos declarados y nada más. */
export const esquemaDatosNota = camposNota.refine(
  (nota) => (nota.lat === null) === (nota.lng === null),
  { path: ["lng"], message: "lat y lng deben venir juntos o ambos en null" },
);

/** Documento guardado en Firestore: los campos base los pone el servidor. */
export const esquemaDocumentoNota = camposNota.extend({
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export const esquemaIdNota = z.object({ id: z.uuid() });

export type DatosNota = z.infer<typeof esquemaDatosNota>;
export type NotaVoz = z.infer<typeof esquemaDocumentoNota> & { id: string };
