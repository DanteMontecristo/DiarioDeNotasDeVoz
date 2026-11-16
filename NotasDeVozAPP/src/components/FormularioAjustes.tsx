import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Ajustes, type Calidad, etiquetaLimite, LIMITES_MS } from "@/utils/ajustes";

type Props = {
  ajustes: Ajustes;
  alCambiar: (cambios: Partial<Ajustes>) => void;
};

type PropsOpcion = { texto: string; descripcion: string; elegida: boolean; alElegir: () => void };

const CALIDADES: readonly { valor: Calidad; texto: string; detalle: string }[] = [
  { valor: "alta", texto: "Alta", detalle: "Mejor sonido, archivos más grandes" },
  { valor: "baja", texto: "Baja", detalle: "Ocupa menos espacio" },
];

function Opcion({ texto, descripcion, elegida, alElegir }: PropsOpcion) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={descripcion}
      accessibilityState={{ checked: elegida }}
      onPress={alElegir}
      style={[estilos.opcion, elegida && estilos.opcionElegida]}
    >
      <Text style={[estilos.textoOpcion, elegida && estilos.textoElegido]}>{texto}</Text>
    </Pressable>
  );
}

/** Pantalla de ajustes: calidad de grabación y límite de tiempo. */
export function FormularioAjustes({ ajustes, alCambiar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        Calidad de grabación
      </Text>
      <View accessibilityRole="radiogroup" style={estilos.grupo}>
        {CALIDADES.map(({ valor, texto, detalle }) => (
          <Opcion
            key={valor}
            texto={`${texto} · ${detalle}`}
            descripcion={`Calidad ${valor}`}
            elegida={ajustes.calidad === valor}
            alElegir={() => alCambiar({ calidad: valor })}
          />
        ))}
      </View>

      <Text accessibilityRole="header" style={estilos.titulo}>
        Límite de tiempo
      </Text>
      <View accessibilityRole="radiogroup" style={estilos.grupo}>
        {LIMITES_MS.map((limite) => (
          <Opcion
            key={limite}
            texto={etiquetaLimite(limite)}
            descripcion={`Límite de ${etiquetaLimite(limite)}`}
            elegida={ajustes.limiteMs === limite}
            alElegir={() => alCambiar({ limiteMs: limite })}
          />
        ))}
      </View>
      <Text style={estilos.ayuda}>
        La grabación se detiene y se guarda sola al llegar al límite. El máximo son 2 minutos.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, gap: 12, backgroundColor: "#ffffff" },
  titulo: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginTop: 8 },
  grupo: { gap: 8 },
  opcion: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  opcionElegida: { borderColor: "#0f766e", backgroundColor: "#0f766e" },
  textoOpcion: { fontSize: 16, color: "#1f2937" },
  textoElegido: { color: "#ffffff", fontWeight: "600" },
  ayuda: { fontSize: 14, color: "#4b5563" },
});
