import { StyleSheet, Switch, Text, View } from "react-native";

type Props = {
  activo: boolean;
  /** Explicación cuando no se pudo activar (por ejemplo, sin permiso). */
  aviso: string | null;
  alCambiar: (activo: boolean) => void;
};

/** Interruptor para decidir si las notas nuevas guardan el lugar donde se grabaron. */
export function InterruptorLugar({ activo, aviso, alCambiar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.fila}>
        <Text style={estilos.titulo}>Guardar el lugar de la nota</Text>
        <Switch
          accessibilityRole="switch"
          accessibilityLabel="Guardar el lugar de la nota"
          value={activo}
          onValueChange={alCambiar}
        />
      </View>
      <Text style={estilos.ayuda}>
        La ubicación se consulta solo al guardar una nota, para mostrar la ciudad donde la grabaste.
      </Text>
      {aviso ? (
        <Text accessibilityLiveRegion="polite" style={estilos.aviso}>
          {aviso}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: "100%", gap: 6, padding: 14, borderRadius: 10, backgroundColor: "#f1f3f6" },
  fila: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titulo: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1f2937" },
  ayuda: { fontSize: 14, color: "#4b5563" },
  aviso: { fontSize: 14, color: "#78350f" },
});
