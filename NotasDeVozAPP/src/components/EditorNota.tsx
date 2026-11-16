import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Boton } from "./Boton";

type Props = {
  titulo: string;
  etiqueta: string | null;
  error: string | null;
  alGuardar: (cambios: { titulo: string; etiqueta: string | null }) => void;
};

/** Formulario para renombrar y etiquetar una nota. La validación la hace el servicio. */
export function EditorNota({ titulo, etiqueta, error, alGuardar }: Props) {
  const [nuevoTitulo, setNuevoTitulo] = useState(titulo);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState(etiqueta ?? "");

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.rotulo}>Título</Text>
      <TextInput
        accessibilityLabel="Título"
        value={nuevoTitulo}
        onChangeText={setNuevoTitulo}
        style={estilos.campo}
      />
      <Text style={estilos.rotulo}>Etiqueta (opcional)</Text>
      <TextInput
        accessibilityLabel="Etiqueta (opcional)"
        value={nuevaEtiqueta}
        onChangeText={setNuevaEtiqueta}
        autoCapitalize="none"
        style={estilos.campo}
      />
      {error ? (
        <Text accessibilityRole="alert" style={estilos.error}>
          {error}
        </Text>
      ) : null}
      <Boton
        texto="Guardar cambios"
        alPulsar={() => alGuardar({ titulo: nuevoTitulo, etiqueta: nuevaEtiqueta || null })}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 8 },
  rotulo: { fontSize: 14, fontWeight: "600", color: "#374151" },
  campo: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  error: { fontSize: 15, color: "#b91c1c" },
});
