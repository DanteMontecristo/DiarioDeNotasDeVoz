import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { Usuario } from "@/api/clienteHttp";
import { Boton } from "@/components/Boton";
import { FormularioAcceso } from "@/components/FormularioAcceso";
import {
  cerrarSesion,
  iniciarSesion,
  registrar,
  type ResultadoAcceso,
  usuarioActual,
} from "@/services/accesoServicio";
import { obtenerConexion } from "@/services/dependenciasAcceso";

type Modo = "entrar" | "registrar";

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar. Inténtalo de nuevo.";
}

/** Estado de la cuenta: quién inició sesión y las acciones de entrar, registrarse y salir. */
function useCuenta() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    // Si falta configurar la URL de la API, el error se muestra en el formulario.
    Promise.resolve()
      .then(() => usuarioActual(obtenerConexion()))
      .then(setUsuario)
      .catch((fallo: unknown) => setError(mensajeDe(fallo)));
  }, []);

  const acceder = useCallback((modo: Modo, email: string, password: string) => {
    const accion = modo === "entrar" ? iniciarSesion : registrar;
    setOcupado(true);
    setError(null);
    Promise.resolve()
      .then(() => accion(obtenerConexion(), email, password))
      .then((resultado: ResultadoAcceso) => {
        setUsuario(resultado.ok ? resultado.usuario : null);
        setError(resultado.ok ? null : resultado.error);
      })
      .catch((fallo: unknown) => setError(mensajeDe(fallo)))
      .finally(() => setOcupado(false));
  }, []);

  const salir = useCallback(() => {
    cerrarSesion(obtenerConexion())
      .then(() => setUsuario(null))
      .catch((fallo: unknown) => setError(mensajeDe(fallo)));
  }, []);

  return { usuario, error, ocupado, acceder, salir };
}

export default function PantallaCuenta() {
  const [modo, setModo] = useState<Modo>("entrar");
  const { usuario, error, ocupado, acceder, salir } = useCuenta();

  return (
    <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      {usuario ? (
        <>
          <Text accessibilityRole="header" style={estilos.titulo}>
            Sesión iniciada
          </Text>
          <Text style={estilos.texto}>{usuario.email ?? "Cuenta sin correo"}</Text>
          <Boton texto="Cerrar sesión" alPulsar={salir} variante="peligro" />
        </>
      ) : (
        <>
          <Text style={estilos.texto}>
            La cuenta es opcional: sirve para respaldar los datos de tus notas. La app funciona sin
            ella y sin conexión.
          </Text>
          <FormularioAcceso
            modo={modo}
            error={error}
            ocupado={ocupado}
            alEnviar={(email, password) => acceder(modo, email, password)}
            alCambiarModo={() => setModo(modo === "entrar" ? "registrar" : "entrar")}
          />
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 16, backgroundColor: "#ffffff", flexGrow: 1 },
  titulo: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  texto: { fontSize: 16, color: "#374151" },
});
