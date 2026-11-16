import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { Boton } from "@/components/Boton";
import { EditorNota } from "@/components/EditorNota";
import { PantallaVacia } from "@/components/PantallaVacia";
import { Reproductor } from "@/components/Reproductor";
import type { Nota } from "@/repositories/notasRepositorio";
import { compartirAudio } from "@/services/compartir";
import { obtenerDependencias } from "@/services/dependencias";
import { eliminarNotaConArchivo, obtenerNotaPorId, renombrarNota } from "@/services/notasServicio";

type Carga =
  | { estado: "cargando" }
  | { estado: "no_existe" }
  | { estado: "lista"; nota: Nota; hayAudio: boolean };
type Cambios = { titulo: string; etiqueta: string | null };
type Mensaje = { texto: string; esError: boolean };

async function cargarNota(id: number): Promise<Carga> {
  const deps = await obtenerDependencias();
  const nota = await obtenerNotaPorId(deps, id);
  if (!nota) {
    return { estado: "no_existe" };
  }
  return { estado: "lista", nota, hayAudio: await deps.almacen.existe(nota.archivoUri) };
}

/** Carga la nota y ofrece las acciones de la pantalla; `mensaje` es el último aviso o error. */
function useNota(id: number, alEliminar: () => void) {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const recargar = useCallback(() => {
    cargarNota(id)
      .then(setCarga)
      .catch(() => setCarga({ estado: "no_existe" }));
  }, [id]);
  useEffect(recargar, [recargar]);

  const guardar = useCallback(
    async (cambios: Cambios) => {
      const resultado = await renombrarNota(await obtenerDependencias(), id, cambios);
      setMensaje(
        resultado.ok
          ? { texto: "Cambios guardados.", esError: false }
          : { texto: resultado.error, esError: true },
      );
      if (resultado.ok) {
        recargar();
      }
    },
    [id, recargar],
  );
  const eliminar = useCallback(async () => {
    await eliminarNotaConArchivo(await obtenerDependencias(), id);
    alEliminar();
  }, [id, alEliminar]);
  const compartir = useCallback(async (uri: string) => {
    const resultado = await compartirAudio(uri);
    setMensaje(resultado.ok ? null : { texto: resultado.error, esError: true });
  }, []);

  return { carga, mensaje, guardar, eliminar, compartir };
}

function confirmarEliminacion(alConfirmar: () => void): void {
  Alert.alert("Eliminar nota", "Se borrarán la nota y su audio. No se puede deshacer.", [
    { text: "Cancelar", style: "cancel" },
    { text: "Eliminar", style: "destructive", onPress: alConfirmar },
  ]);
}

/** El reproductor, o el aviso de que el audio se perdió (por ejemplo, al reinstalar la app). */
function Audio({ nota, hayAudio }: { nota: Nota; hayAudio: boolean }) {
  if (hayAudio) {
    return <Reproductor uri={nota.archivoUri} duracionMs={nota.duracionMs} />;
  }
  return (
    <Text accessibilityRole="alert" style={estilos.sinAudio}>
      Audio no disponible: el archivo ya no está en este teléfono. Se conservan los datos de la
      nota.
    </Text>
  );
}

export default function PantallaNota() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const volver = useCallback(() => router.back(), [router]);
  const { carga, mensaje, guardar, eliminar, compartir } = useNota(Number(id), volver);

  if (carga.estado === "cargando") {
    return <PantallaVacia titulo="Cargando…" descripcion="Buscando la nota." />;
  }
  if (carga.estado === "no_existe") {
    return (
      <PantallaVacia titulo="La nota ya no existe" descripcion="Vuelve a la lista de notas." />
    );
  }
  const { nota, hayAudio } = carga;

  return (
    <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: nota.titulo }} />
      <Audio nota={nota} hayAudio={hayAudio} />
      <EditorNota
        key={nota.updatedAt}
        titulo={nota.titulo}
        etiqueta={nota.etiqueta}
        error={mensaje?.esError ? mensaje.texto : null}
        alGuardar={(cambios) => void guardar(cambios)}
      />
      {mensaje && !mensaje.esError ? (
        <Text accessibilityLiveRegion="polite" style={estilos.mensaje}>
          {mensaje.texto}
        </Text>
      ) : null}
      {hayAudio ? (
        <Boton
          texto="Compartir audio"
          alPulsar={() => void compartir(nota.archivoUri)}
          variante="suave"
        />
      ) : null}
      <Boton
        texto="Eliminar nota"
        alPulsar={() => confirmarEliminacion(() => void eliminar())}
        variante="peligro"
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 16, backgroundColor: "#ffffff", flexGrow: 1 },
  sinAudio: {
    padding: 16,
    borderRadius: 10,
    fontSize: 15,
    color: "#78350f",
    backgroundColor: "#fef3c7",
  },
  mensaje: { fontSize: 15, color: "#1f2937", textAlign: "center" },
});
