import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function LayoutRaiz() {
  return (
    <GestureHandlerRootView style={estilos.raiz}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="nota/[id]" options={{ title: "Nota" }} />
        <Stack.Screen name="ajustes" options={{ title: "Ajustes" }} />
        <Stack.Screen name="cuenta" options={{ title: "Cuenta" }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
});
