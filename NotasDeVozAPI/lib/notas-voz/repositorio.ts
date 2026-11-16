import { obtenerDb } from "@/lib/firebase";
import { type DatosNota, esquemaDocumentoNota, type NotaVoz } from "./esquema";

export const LIMITE_POR_PAGINA = 500;

/** El aislamiento entre usuarios lo da la ruta: cada uno solo alcanza su subcolección. */
function coleccion(uid: string) {
  return obtenerDb().collection(`usuarios/${uid}/nota_voz`);
}

function aNota(id: string, datos: unknown): NotaVoz {
  return { id, ...esquemaDocumentoNota.parse(datos) };
}

/** Notas modificadas después de `desde` (o todas), borrados lógicos incluidos. */
export async function listarDesde(uid: string, desde: string | null): Promise<NotaVoz[]> {
  const notas = coleccion(uid);
  const filtradas = desde === null ? notas : notas.where("updated_at", ">", desde);
  const resultado = await filtradas.orderBy("updated_at").limit(LIMITE_POR_PAGINA).get();
  return resultado.docs.map((doc) => aNota(doc.id, doc.data()));
}

/** Notas vigentes (sin borrado lógico) grabadas en `[inicio, fin)`. */
export async function listarGrabadasEntre(
  uid: string,
  inicio: string,
  fin: string,
): Promise<NotaVoz[]> {
  const resultado = await coleccion(uid)
    .where("grabada_en", ">=", inicio)
    .where("grabada_en", "<", fin)
    .get();
  // El borrado se filtra aquí: hacerlo en la consulta exigiría un índice compuesto.
  return resultado.docs
    .map((doc) => aNota(doc.id, doc.data()))
    .filter((nota) => nota.deleted_at === null);
}

/** Crea o reemplaza (idempotente). Gana la última escritura según la hora del servidor. */
export function guardar(
  uid: string,
  id: string,
  datos: DatosNota,
  ahora: string,
): Promise<NotaVoz> {
  const referencia = coleccion(uid).doc(id);
  return obtenerDb().runTransaction(async (transaccion) => {
    const actual = await transaccion.get(referencia);
    const creada = actual.exists ? aNota(id, actual.data()).created_at : ahora;
    const documento = { ...datos, created_at: creada, updated_at: ahora, deleted_at: null };
    transaccion.set(referencia, documento);
    return { id, ...documento };
  });
}

/** Borrado lógico. Devuelve `false` si la nota no existe para ese usuario. */
export function borrar(uid: string, id: string, ahora: string): Promise<boolean> {
  const referencia = coleccion(uid).doc(id);
  return obtenerDb().runTransaction(async (transaccion) => {
    const actual = await transaccion.get(referencia);
    if (!actual.exists) {
      return false;
    }
    if (aNota(id, actual.data()).deleted_at === null) {
      transaccion.update(referencia, { deleted_at: ahora, updated_at: ahora });
    }
    return true;
  });
}
