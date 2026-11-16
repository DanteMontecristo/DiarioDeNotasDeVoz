import { Link, Tabs } from "expo-router";
import { StyleSheet } from "react-native";

function EnlaceAjustes() {
  return (
    <Link
      href="/ajustes"
      accessibilityRole="button"
      accessibilityLabel="Abrir ajustes"
      style={estilos.enlace}
    >
      Ajustes
    </Link>
  );
}

export default function LayoutPestanas() {
  return (
    <Tabs screenOptions={{ headerRight: EnlaceAjustes, tabBarLabelStyle: estilos.etiqueta }}>
      <Tabs.Screen name="index" options={{ title: "Mis notas", tabBarLabel: "Notas" }} />
      <Tabs.Screen name="grabar" options={{ title: "Grabar", tabBarLabel: "Grabar" }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  enlace: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#0f766e" },
  etiqueta: { fontSize: 14 },
});
