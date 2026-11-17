import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { Usuario } from "@/api/clienteHttp";
import { FormularioAcceso } from "@/components/FormularioAcceso";
import { PanelCuenta } from "@/components/PanelCuenta";
import {
  cerrarSesion,
  iniciarSesion,
  registrar,
  type ResultadoAcceso,
  usuarioActual,
} from "@/services/accesoServicio";
import { obtenerConexion } from "@/services/dependenciasAcceso";
import { obtenerResumen, type Resumen } from "@/services/resumenServicio";
import { sincronizarAhora } from "@/services/sincronizacion";
import type { ResultadoSincronizacion } from "@/services/sincronizacionServicio";

type Modo = "entrar" | "registrar";

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar. Inténtalo de nuevo.";
}

function describir(resultado: ResultadoSincronizacion): string {
  if (!resultado.ok) {
    return resultado.error;
  }
  const base = `Enviadas: ${resultado.enviadas} · Recibidas: ${resultado.recibidas}`;
  return resultado.rechazadas > 0 ? `${base} · Rechazadas: ${resultado.rechazadas}` : base;
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

/** Resumen de la semana actual, o `null` si no se pudo obtener. */
async function pedirResumen(): Promise<Resumen | null> {
  const desfase = -new Date().getTimezoneOffset();
  const resultado = await obtenerResumen(obtenerConexion().cliente, desfase);
  return resultado.ok ? resultado.resumen : null;
}

/** Sincronización manual y resumen semanal; el resumen se carga al iniciar sesión. */
function useRespaldo(conSesion: boolean) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);

  const sincronizar = useCallback(() => {
    setOcupado(true);
    sincronizarAhora()
      .then((resultado) => setMensaje(describir(resultado)))
      .then(pedirResumen)
      .then(setResumen)
      .catch((fallo: unknown) => setMensaje(mensajeDe(fallo)))
      .finally(() => setOcupado(false));
  }, []);

  useEffect(() => {
    if (!conSesion) {
      return;
    }
    let vigente = true;
    pedirResumen()
      .then((leido) => vigente && setResumen(leido))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [conSesion]);

  return { mensaje, ocupado, resumen, sincronizar };
}

export default function PantallaCuenta() {
  const [modo, setModo] = useState<Modo>("entrar");
  const { usuario, error, ocupado, acceder, salir } = useCuenta();
  const respaldo = useRespaldo(usuario !== null);

  return (
    <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      {usuario ? (
        <PanelCuenta
          email={usuario.email}
          mensaje={respaldo.mensaje}
          ocupado={respaldo.ocupado}
          resumen={respaldo.resumen}
          alSincronizar={respaldo.sincronizar}
          alCerrarSesion={salir}
        />
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
  texto: { fontSize: 16, color: "#374151" },
});
