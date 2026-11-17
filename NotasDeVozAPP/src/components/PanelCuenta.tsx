import { StyleSheet, Text, View } from "react-native";
import type { DiaResumen, Resumen } from "@/services/resumenServicio";
import { Boton } from "./Boton";

type Props = {
  email: string | null;
  mensaje: string | null;
  ocupado: boolean;
  resumen: Resumen | null;
  alSincronizar: () => void;
  alCerrarSesion: () => void;
};

function minutos(valor: number): string {
  return `${String(valor).replace(".", ",")} min`;
}

/** `2026-11-16` → `16/11`. */
function diaYMes(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

function lineaDe(dia: DiaResumen): string {
  const notas = dia.notas === 1 ? "1 nota" : `${dia.notas} notas`;
  return `${diaYMes(dia.fecha)} · ${minutos(dia.minutos)} · ${notas}`;
}

function ResumenSemana({ resumen }: { resumen: Resumen }) {
  return (
    <View style={estilos.resumen}>
      <Text accessibilityRole="header" style={estilos.subtitulo}>
        Esta semana
      </Text>
      <Text style={estilos.total}>Total: {minutos(resumen.totalMinutos)}</Text>
      {resumen.dias.map((dia) => (
        <Text key={dia.fecha} style={estilos.texto}>
          {lineaDe(dia)}
        </Text>
      ))}
    </View>
  );
}

/** Lo que ve quien ya inició sesión: sincronizar, el resumen semanal y cerrar sesión. */
export function PanelCuenta(props: Props) {
  const { email, mensaje, ocupado, resumen, alSincronizar, alCerrarSesion } = props;

  return (
    <View style={estilos.contenedor}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        Sesión iniciada
      </Text>
      <Text style={estilos.texto}>{email ?? "Cuenta sin correo"}</Text>
      <Boton
        texto={ocupado ? "Sincronizando…" : "Sincronizar ahora"}
        alPulsar={() => (ocupado ? undefined : alSincronizar())}
      />
      {mensaje ? (
        <Text accessibilityLiveRegion="polite" style={estilos.texto}>
          {mensaje}
        </Text>
      ) : null}
      <Text style={estilos.ayuda}>
        Se respaldan los datos de cada nota. El audio se queda en este teléfono.
      </Text>
      {resumen ? <ResumenSemana resumen={resumen} /> : null}
      <Boton texto="Cerrar sesión" alPulsar={alCerrarSesion} variante="peligro" />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 12 },
  titulo: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  subtitulo: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  total: { fontSize: 16, fontWeight: "600", color: "#0f766e" },
  texto: { fontSize: 16, color: "#374151" },
  ayuda: { fontSize: 14, color: "#4b5563" },
  resumen: { gap: 4, padding: 14, borderRadius: 10, backgroundColor: "#f1f3f6" },
});
