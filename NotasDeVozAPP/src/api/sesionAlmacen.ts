import * as SecureStore from "expo-secure-store";
import { type AlmacenSesion, esObjeto, type Sesion } from "./clienteHttp";

const CLAVE = "sesion";

export function esSesion(valor: unknown): valor is Sesion {
  if (!esObjeto(valor) || !esObjeto(valor.usuario)) {
    return false;
  }
  const { token, refreshToken, usuario } = valor;
  const emailValido = typeof usuario.email === "string" || usuario.email === null;
  return (
    typeof token === "string" &&
    typeof refreshToken === "string" &&
    typeof usuario.id === "string" &&
    emailValido
  );
}

function interpretar(texto: string | null): Sesion | null {
  if (texto === null) {
    return null;
  }
  try {
    const valor: unknown = JSON.parse(texto);
    return esSesion(valor) ? valor : null;
  } catch {
    return null;
  }
}

/** Los tokens viven en el almacenamiento seguro del sistema, nunca en AsyncStorage. */
export const sesionAlmacen: AlmacenSesion = {
  async leer() {
    return interpretar(await SecureStore.getItemAsync(CLAVE));
  },
  async guardar(sesion) {
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(sesion));
  },
  async borrar() {
    await SecureStore.deleteItemAsync(CLAVE);
  },
};
