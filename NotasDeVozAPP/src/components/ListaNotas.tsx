import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Nota } from "@/repositories/notasRepositorio";
import { formatearDuracion } from "@/utils/duracion";
import { formatearFecha } from "@/utils/fecha";

type Props = {
  notas: Nota[];
  busqueda: string;
  cargando: boolean;
  alBuscar: (texto: string) => void;
  alAbrir: (id: number) => void;
};

function describir(nota: Nota): string {
  const etiqueta = nota.etiqueta ? `, etiqueta ${nota.etiqueta}` : "";
  const duracion = formatearDuracion(nota.duracionMs);
  return `${nota.titulo}${etiqueta}, duración ${duracion}, ${formatearFecha(nota.creadaEn)}`;
}

function Fila({ nota, alAbrir }: { nota: Nota; alAbrir: (id: number) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={describir(nota)}
      onPress={() => alAbrir(nota.id)}
      style={estilos.fila}
    >
      <Text style={estilos.titulo} numberOfLines={2}>
        {nota.titulo}
      </Text>
      {nota.etiqueta ? <Text style={estilos.etiqueta}>{nota.etiqueta}</Text> : null}
      <Text style={estilos.detalle}>
        {formatearDuracion(nota.duracionMs)} · {formatearFecha(nota.creadaEn)}
      </Text>
    </Pressable>
  );
}

function Vacio({ busqueda, cargando }: { busqueda: string; cargando: boolean }) {
  if (cargando) {
    return <Text style={estilos.aviso}>Cargando notas…</Text>;
  }
  if (busqueda.trim() !== "") {
    return <Text style={estilos.aviso}>Ninguna nota coincide con «{busqueda.trim()}».</Text>;
  }
  return (
    <View style={estilos.vacio}>
      <Text accessibilityRole="header" style={estilos.tituloVacio}>
        Aún no hay notas
      </Text>
      <Text style={estilos.aviso}>Ve a la pestaña Grabar para crear tu primera nota de voz.</Text>
    </View>
  );
}

/** Lista de notas con su campo de búsqueda por título o etiqueta. */
export function ListaNotas({ notas, busqueda, cargando, alBuscar, alAbrir }: Props) {
  return (
    <View style={estilos.contenedor}>
      <TextInput
        accessibilityLabel="Buscar por título o etiqueta"
        placeholder="Buscar por título o etiqueta"
        placeholderTextColor="#6b7280"
        value={busqueda}
        onChangeText={alBuscar}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={estilos.buscador}
      />
      <FlatList
        data={notas}
        keyExtractor={(nota) => String(nota.id)}
        renderItem={({ item }) => <Fila nota={item} alAbrir={alAbrir} />}
        ListEmptyComponent={<Vacio busqueda={busqueda} cargando={cargando} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilos.lista}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#ffffff" },
  buscador: {
    minHeight: 48,
    margin: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  lista: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, flexGrow: 1 },
  fila: { minHeight: 48, padding: 14, borderRadius: 10, backgroundColor: "#f1f3f6", gap: 4 },
  titulo: { fontSize: 17, fontWeight: "600", color: "#1f2937" },
  etiqueta: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 13,
    color: "#ffffff",
    backgroundColor: "#0f766e",
    overflow: "hidden",
  },
  detalle: { fontSize: 14, color: "#4b5563" },
  vacio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  tituloVacio: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  aviso: { fontSize: 16, color: "#4b5563", textAlign: "center", padding: 16 },
});
