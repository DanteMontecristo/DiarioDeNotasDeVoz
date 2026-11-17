import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Boton } from "./Boton";

type Props = {
  modo: "entrar" | "registrar";
  error: string | null;
  ocupado: boolean;
  alEnviar: (email: string, password: string) => void;
  alCambiarModo: () => void;
};

const TEXTOS = {
  entrar: { enviar: "Iniciar sesión", cambiar: "No tengo cuenta: crear una" },
  registrar: { enviar: "Crear cuenta", cambiar: "Ya tengo cuenta: iniciar sesión" },
};

/** Formulario de inicio de sesión y de registro. La contraseña nunca se guarda en la app. */
export function FormularioAcceso({ modo, error, ocupado, alEnviar, alCambiarModo }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const textos = TEXTOS[modo];

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.rotulo}>Correo</Text>
      <TextInput
        accessibilityLabel="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        style={estilos.campo}
      />
      <Text style={estilos.rotulo}>Contraseña</Text>
      <TextInput
        accessibilityLabel="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        style={estilos.campo}
      />
      {modo === "registrar" ? (
        <Text style={estilos.ayuda}>La contraseña debe tener al menos 8 caracteres.</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={estilos.error}>
          {error}
        </Text>
      ) : null}
      <Boton
        texto={ocupado ? "Enviando…" : textos.enviar}
        alPulsar={() => (ocupado ? undefined : alEnviar(email, password))}
      />
      <Boton texto={textos.cambiar} alPulsar={alCambiarModo} variante="suave" />
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
  ayuda: { fontSize: 14, color: "#4b5563" },
  error: { fontSize: 15, color: "#b91c1c" },
});
