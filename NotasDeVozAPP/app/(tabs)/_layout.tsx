import { Link, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

type PropsEnlace = { destino: "/cuenta" | "/ajustes"; texto: string; descripcion: string };

function Enlace({ destino, texto, descripcion }: PropsEnlace) {
  return (
    <Link
      href={destino}
      accessibilityRole="button"
      accessibilityLabel={descripcion}
      style={estilos.enlace}
    >
      {texto}
    </Link>
  );
}

function EnlacesCabecera() {
  return (
    <View style={estilos.cabecera}>
      <Enlace destino="/cuenta" texto="Cuenta" descripcion="Abrir cuenta" />
      <Enlace destino="/ajustes" texto="Ajustes" descripcion="Abrir ajustes" />
    </View>
  );
}

export default function LayoutPestanas() {
  return (
    <Tabs screenOptions={{ headerRight: EnlacesCabecera, tabBarLabelStyle: estilos.etiqueta }}>
      <Tabs.Screen name="index" options={{ title: "Mis notas", tabBarLabel: "Notas" }} />
      <Tabs.Screen name="grabar" options={{ title: "Grabar", tabBarLabel: "Grabar" }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: "row" },
  enlace: { paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#0f766e" },
  etiqueta: { fontSize: 14 },
});
