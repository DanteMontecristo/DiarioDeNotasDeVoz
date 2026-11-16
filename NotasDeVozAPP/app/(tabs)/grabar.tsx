import { useCallback, useState } from "react";
import { Grabadora } from "@/components/Grabadora";
import type { AudioGrabado } from "@/sensors/useGrabadora";
import { obtenerDependencias } from "@/services/dependencias";
import { guardarGrabacion } from "@/services/notasServicio";
import { formatearDuracion } from "@/utils/duracion";

async function guardar(audio: AudioGrabado): Promise<string> {
  const deps = await obtenerDependencias();
  const resultado = await guardarGrabacion(deps, {
    uriTemporal: audio.uri,
    duracionMs: audio.duracionMs,
    titulo: "",
    etiqueta: null,
    lugar: null,
  });
  if (!resultado.ok) {
    return resultado.error;
  }
  const { titulo, duracionMs } = resultado.nota;
  return `Se guardó «${titulo}» (${formatearDuracion(duracionMs)}).`;
}

async function descartar(uri: string): Promise<string> {
  const deps = await obtenerDependencias();
  await deps.almacen.borrar(uri);
  return "Grabación cancelada: no se guardó nada.";
}

export default function PantallaGrabar() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  const mostrar = useCallback((tarea: Promise<string>) => {
    tarea.then(setMensaje).catch(() => setMensaje("No se pudo completar. Inténtalo de nuevo."));
  }, []);
  const alTerminar = useCallback((audio: AudioGrabado) => mostrar(guardar(audio)), [mostrar]);
  const alDescartar = useCallback((uri: string) => mostrar(descartar(uri)), [mostrar]);

  return <Grabadora alTerminar={alTerminar} alDescartar={alDescartar} mensaje={mensaje} />;
}
