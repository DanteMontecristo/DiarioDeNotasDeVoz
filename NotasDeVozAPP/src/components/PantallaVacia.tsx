import { StyleSheet, Text, View } from "react-native";

type Props = {
  titulo: string;
  descripcion: string;
};

/** Pantalla centrada con un título y un texto de apoyo, para estados sin contenido. */
export function PantallaVacia({ titulo, descripcion }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {titulo}
      </Text>
      <Text style={estilos.descripcion}>{descripcion}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "#ffffff",
  },
  titulo: { fontSize: 22, fontWeight: "700", color: "#1f2937", textAlign: "center" },
  descripcion: { fontSize: 16, color: "#4b5563", textAlign: "center" },
});
