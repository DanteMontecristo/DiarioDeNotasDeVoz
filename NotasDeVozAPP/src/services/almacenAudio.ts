import { Directory, File, Paths } from "expo-file-system";

/** Dónde viven los audios. Se inyecta en el servicio para poder probarlo sin teléfono. */
export type AlmacenAudio = {
  /** Mueve la grabación temporal a un lugar persistente y devuelve su ruta definitiva. */
  guardar(uriTemporal: string, nombre: string): Promise<string>;
  borrar(uri: string): Promise<void>;
  /** Tras reinstalar la app quedan los datos de la nota pero no su audio. */
  existe(uri: string): Promise<boolean>;
};

const CARPETA_NOTAS = "notas";

export const almacenAudio: AlmacenAudio = {
  async guardar(uriTemporal, nombre) {
    // Carpeta de documentos: persistente. La caché no sirve, el sistema puede vaciarla.
    const carpeta = new Directory(Paths.document, CARPETA_NOTAS);
    carpeta.create({ intermediates: true, idempotent: true });
    const destino = new File(carpeta, nombre);
    await new File(uriTemporal).move(destino);
    return destino.uri;
  },

  async borrar(uri) {
    // Una nota traída de otro dispositivo no tiene audio: su ruta está vacía.
    if (uri === "") {
      return;
    }
    const archivo = new File(uri);
    if (archivo.exists) {
      archivo.delete();
    }
  },

  async existe(uri) {
    return uri !== "" && new File(uri).exists;
  },
};
