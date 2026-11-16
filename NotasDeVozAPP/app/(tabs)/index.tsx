import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ListaNotas } from "@/components/ListaNotas";
import type { Nota } from "@/repositories/notasRepositorio";
import { obtenerDependencias } from "@/services/dependencias";
import { buscarNotas } from "@/services/notasServicio";

export default function PantallaNotas() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [notas, setNotas] = useState<Nota[] | null>(null);

  // Se recarga al volver a la pestaña (por ejemplo, después de grabar) y al cambiar la búsqueda.
  const cargar = useCallback(() => {
    let vigente = true;
    obtenerDependencias()
      .then((deps) => buscarNotas(deps, busqueda))
      .then((encontradas) => vigente && setNotas(encontradas))
      .catch(() => vigente && setNotas([]));
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
