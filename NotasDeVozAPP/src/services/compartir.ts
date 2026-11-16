import * as Sharing from "expo-sharing";

const TIPOS: Record<string, string> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  "3gp": "audio/3gpp",
  caf: "audio/x-caf",
};

/** La calidad baja graba en otro formato: el tipo se deduce de la extensión del archivo. */
function tipoDe(uri: string): string {
  const extension = /\.([a-z0-9]+)$/i.exec(uri)?.[1]?.toLowerCase() ?? "";
  return TIPOS[extension] ?? "audio/*";
}

export type ResultadoCompartir = { ok: true } | { ok: false; error: string };

/** Abre el diálogo del sistema para compartir el archivo de audio de una nota. */
export async function compartirAudio(uri: string): Promise<ResultadoCompartir> {
  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, error: "Este teléfono no permite compartir archivos." };
  }
  try {
    await Sharing.shareAsync(uri, { mimeType: tipoDe(uri), dialogTitle: "Compartir nota de voz" });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo compartir el audio." };
  }
}
