import { useState } from "react";
import { type AccessibilityActionEvent, StyleSheet, Text, View } from "react-native";
import { GestureDetector, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import { type EstadoReproductor, useReproductor } from "@/sensors/useReproductor";
import { formatearDuracion } from "@/utils/duracion";
import { direccionDelToque, etiquetaVelocidad, posicionDesdeBarra } from "@/utils/reproductor";
import { Boton } from "./Boton";

type Props = { uri: string; duracionMs: number };

const MS_POR_SEGUNDO = 1000;

/** Barra de progreso: se arrastra con el dedo o se ajusta con las acciones de accesibilidad. */
function Barra({ reproductor }: { reproductor: EstadoReproductor }) {
  const [ancho, setAncho] = useState(0);
  const { posicionMs, duracionMs } = reproductor;
  const arrastrar = usePanGesture({
    runOnJS: true,
    onUpdate: (evento) => reproductor.irA(posicionDesdeBarra(evento.x, ancho, duracionMs)),
  });
  const porcentaje = duracionMs > 0 ? Math.min(100, (posicionMs / duracionMs) * 100) : 0;

  function alAjustar(evento: AccessibilityActionEvent): void {
    reproductor.saltar(evento.nativeEvent.actionName === "increment" ? "adelante" : "atras");
  }

  return (
    <GestureDetector gesture={arrastrar}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Posición de reproducción"
        accessibilityValue={{
          min: 0,
          max: Math.round(duracionMs / MS_POR_SEGUNDO),
          now: Math.round(posicionMs / MS_POR_SEGUNDO),
          text: `${formatearDuracion(posicionMs)} de ${formatearDuracion(duracionMs)}`,
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={alAjustar}
        onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}
        style={estilos.zonaBarra}
      >
        <View style={estilos.barra}>
          <View style={[estilos.avance, { width: `${porcentaje}%` }]} />
        </View>
      </View>
    </GestureDetector>
  );
}

/** Zona de doble toque: la mitad derecha avanza 10 s y la izquierda retrocede 10 s. */
function ZonaDobleToque({ reproductor }: { reproductor: EstadoReproductor }) {
  const [ancho, setAncho] = useState(0);
  const dobleToque = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    onActivate: (evento) => reproductor.saltar(direccionDelToque(evento.x, ancho)),
  });

  return (
    <GestureDetector gesture={dobleToque}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}
        style={estilos.zonaToque}
      >
        <Text style={estilos.textoToque}>« −10 s</Text>
        <Text style={estilos.ayuda}>Doble toque</Text>
        <Text style={estilos.textoToque}>+10 s »</Text>
      </View>
    </GestureDetector>
  );
}

export function Reproductor({ uri, duracionMs }: Props) {
  const reproductor = useReproductor(uri, duracionMs);
  const velocidad = etiquetaVelocidad(reproductor.velocidad);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.tiempo}>
        {formatearDuracion(reproductor.posicionMs)} / {formatearDuracion(reproductor.duracionMs)}
      </Text>
      <Barra reproductor={reproductor} />
      <ZonaDobleToque reproductor={reproductor} />
      <View style={estilos.fila}>
        <Boton
          texto="−10 s"
          descripcion="Retroceder 10 segundos"
          alPulsar={() => reproductor.saltar("atras")}
          variante="suave"
        />
        <Boton
          texto={reproductor.reproduciendo ? "Pausar" : "Reproducir"}
          alPulsar={reproductor.alternar}
        />
        <Boton
          texto="+10 s"
          descripcion="Avanzar 10 segundos"
          alPulsar={() => reproductor.saltar("adelante")}
          variante="suave"
        />
        <Boton
          texto={velocidad}
          descripcion={`Velocidad ${velocidad}, cambiar`}
          alPulsar={reproductor.cambiarVelocidad}
          variante="suave"
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 12 },
  tiempo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  zonaBarra: { minHeight: 48, justifyContent: "center" },
  barra: { height: 10, borderRadius: 5, backgroundColor: "#e5e7eb", overflow: "hidden" },
  avance: { height: "100%", backgroundColor: "#0f766e" },
  zonaToque: {
    minHeight: 96,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: "#f1f3f6",
  },
  textoToque: { fontSize: 16, fontWeight: "600", color: "#0f766e" },
  ayuda: { fontSize: 14, color: "#4b5563" },
  fila: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
});
