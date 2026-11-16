import { type ReactNode, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import { type AudioGrabado, type EstadoGrabadora, useGrabadora } from "@/sensors/useGrabadora";
import type { Calidad } from "@/utils/ajustes";
import { DURACION_MAXIMA_MS, formatearDuracion } from "@/utils/duracion";
import { debeCancelar } from "@/utils/grabadora";
import { Boton } from "./Boton";

type Props = {
  alTerminar: (audio: AudioGrabado) => void;
  alDescartar?: (uri: string) => void;
  mensaje: string | null;
  calidad?: Calidad;
  limiteMs?: number;
  /** Contenido extra al final de la pantalla (por ejemplo, el interruptor de lugar). */
  pie?: ReactNode;
};

const MANTENER_MS = 250;
const SIN_LIMITE_DE_MOVIMIENTO = 100_000;

function ignorar(): void {}

function AvisoPermiso() {
  return (
    <View style={estilos.aviso}>
      <Text style={estilos.textoAviso}>
        No hay permiso para usar el micrófono. Para grabar, actívalo en los ajustes del teléfono:
        Aplicaciones → Diario de notas de voz → Permisos → Micrófono. El resto de la app sigue
        funcionando.
      </Text>
      <Boton
        texto="Abrir ajustes del teléfono"
        alPulsar={() => void Linking.openSettings()}
        variante="suave"
      />
    </View>
  );
}

function Medidor({ nivel }: { nivel: number }) {
  const porcentaje = Math.round(nivel * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Nivel de voz"
      accessibilityValue={{ min: 0, max: 100, now: porcentaje }}
      style={estilos.medidor}
    >
      <View style={[estilos.nivel, { width: `${porcentaje}%` }]} />
    </View>
  );
}

/** Mantener presionado graba; soltar guarda, salvo que el dedo se haya deslizado a la izquierda. */
function useGestoGrabar(grabadora: EstadoGrabadora) {
  const [porCancelar, setPorCancelar] = useState(false);
  const cancelar = useRef(false);

  function marcarCancelacion(valor: boolean): void {
    cancelar.current = valor;
    setPorCancelar(valor);
  }

  const mantener = useLongPressGesture({
    runOnJS: true,
    minDuration: MANTENER_MS,
    maxDistance: SIN_LIMITE_DE_MOVIMIENTO,
    onActivate: () => grabadora.iniciar(),
    onFinalize: () => {
      grabadora.terminar(!cancelar.current);
      marcarCancelacion(false);
    },
  });
  const deslizar = usePanGesture({
    runOnJS: true,
    onUpdate: (evento) => marcarCancelacion(debeCancelar(evento.translationX)),
  });
  return { gesto: useSimultaneousGestures(mantener, deslizar), porCancelar };
}

function Botones({ grabadora }: { grabadora: EstadoGrabadora }) {
  if (!grabadora.grabando) {
    return <Boton texto="Iniciar grabación" alPulsar={grabadora.iniciar} />;
  }
  return (
    <View style={estilos.fila}>
      <Boton texto="Detener y guardar" alPulsar={() => grabadora.terminar(true)} />
      <Boton
        texto="Cancelar grabación"
        alPulsar={() => grabadora.terminar(false)}
        variante="suave"
      />
    </View>
  );
}

/** Grabadora: mantener presionado graba, soltar guarda y deslizar a la izquierda cancela. */
export function Grabadora({
  alTerminar,
  alDescartar = ignorar,
  mensaje,
  pie,
  calidad = "alta",
  limiteMs = DURACION_MAXIMA_MS,
}: Props) {
  const grabadora = useGrabadora({ alTerminar, alDescartar, calidad, limiteMs });
  const { gesto, porCancelar } = useGestoGrabar(grabadora);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.tiempo}>
        {formatearDuracion(grabadora.duracionMs)} / {formatearDuracion(limiteMs)}
      </Text>
      <Medidor nivel={grabadora.nivel} />

      <GestureDetector gesture={gesto}>
        <View
          style={[estilos.circulo, grabadora.grabando && estilos.circuloActivo]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={estilos.textoCirculo}>
            {grabadora.grabando ? "Grabando…" : "Mantén presionado"}
          </Text>
        </View>
      </GestureDetector>
      <Text style={estilos.ayuda}>
        {porCancelar
          ? "Suelta para cancelar"
          : "Suelta para guardar · desliza a la izquierda para cancelar"}
      </Text>

      <Botones grabadora={grabadora} />
      {grabadora.permisoNegado ? <AvisoPermiso /> : null}
      {mensaje ? (
        <Text accessibilityLiveRegion="polite" style={estilos.mensaje}>
          {mensaje}
        </Text>
      ) : null}
      {pie}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", padding: 24, gap: 16, backgroundColor: "#ffffff" },
  tiempo: { fontSize: 32, fontWeight: "700", color: "#1f2937", fontVariant: ["tabular-nums"] },
  medidor: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  nivel: { height: "100%", backgroundColor: "#0f766e" },
  circulo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f766e",
  },
  circuloActivo: { backgroundColor: "#b91c1c" },
  textoCirculo: { color: "#ffffff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  ayuda: { fontSize: 14, color: "#4b5563", textAlign: "center" },
  fila: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  aviso: { gap: 12, padding: 16, borderRadius: 10, backgroundColor: "#fef3c7" },
  textoAviso: { fontSize: 15, color: "#78350f" },
  mensaje: { fontSize: 16, color: "#1f2937", textAlign: "center" },
});
