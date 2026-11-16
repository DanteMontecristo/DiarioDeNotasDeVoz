import * as Sharing from "expo-sharing";

export type ResultadoCompartir = { ok: true } | { ok: false; error: string };

/** Abre el diálogo del sistema para compartir el archivo de audio de una nota. */
export async function compartirAudio(uri: string): Promise<ResultadoCompartir> {
  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, error: "Este teléfono no permite compartir archivos." };
  }
  try {
    await Sharing.shareAsync(uri, { mimeType: "audio/mp4", dialogTitle: "Compartir nota de voz" });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo compartir el audio." };
  }
}
