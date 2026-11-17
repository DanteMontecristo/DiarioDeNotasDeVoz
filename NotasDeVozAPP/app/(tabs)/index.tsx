import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ListaNotas } from "@/components/ListaNotas";
import type { Nota } from "@/repositories/notasRepositorio";
import { obtenerDependencias } from "@/services/dependencias";
import { buscarNotas } from "@/services/notasServicio";
import { sincronizarEnSegundoPlano } from "@/services/sincronizacion";

async function leerNotas(busqueda: string): Promise<Nota[]> {
  return buscarNotas(await obtenerDependencias(), busqueda);
}

export default function PantallaNotas() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [notas, setNotas] = useState<Nota[] | null>(null);

  // Se recarga al volver a la pestaña (por ejemplo, después de grabar) y al cambiar la búsqueda.
  const cargar = useCallback(() => {
    let vigente = true;
    const mostrar = (encontradas: Nota[]) => vigente && setNotas(encontradas);
    leerNotas(busqueda)
      .then(mostrar)
      .catch(() => vigente && setNotas([]));
    // Si hay sesión, sincroniza en silencio; si llegan notas nuevas, vuelve a leer la lista.
    sincronizarEnSegundoPlano(Date.now())
      .then((hayNuevas) => (hayNuevas ? leerNotas(busqueda).then(mostrar) : undefined))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [busqueda]);
  useFocusEffect(cargar);

  return (
    <ListaNotas
      notas={notas ?? []}
      cargando={notas === null}
      busqueda={busqueda}
      alBuscar={setBusqueda}
      alAbrir={(id) => router.push({ pathname: "/nota/[id]", params: { id: String(id) } })}
    />
  );
}
