import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  texto: string;
  alPulsar: () => void;
  /** Texto para lectores de pantalla, si debe ser distinto del visible. */
  descripcion?: string;
  variante?: "principal" | "suave" | "peligro";
};

/** Botón de la app: zona táctil de al menos 48 puntos y etiqueta accesible. */
export function Boton({ texto, alPulsar, descripcion, variante = "principal" }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descripcion ?? texto}
      onPress={alPulsar}
      style={[estilos.boton, estilos[variante]]}
    >
      <Text style={[estilos.texto, variante !== "principal" && estilos[`texto_${variante}`]]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  principal: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  suave: { backgroundColor: "#ffffff", borderColor: "#0f766e" },
  peligro: { backgroundColor: "#ffffff", borderColor: "#b91c1c" },
  texto: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  texto_suave: { color: "#0f766e" },
  texto_peligro: { color: "#b91c1c" },
});
