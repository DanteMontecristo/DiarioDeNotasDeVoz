import { useCallback, useState } from "react";
import { Grabadora } from "@/components/Grabadora";
import { InterruptorLugar } from "@/components/InterruptorLugar";
import type { AudioGrabado } from "@/sensors/useGrabadora";
import { obtenerDependencias } from "@/services/dependencias";
import { guardarGrabacion } from "@/services/notasServicio";
import { obtenerLugar, pedirPermisoUbicacion } from "@/services/ubicacion";
import { useAjustes } from "@/services/useAjustes";
import type { Ajustes } from "@/utils/ajustes";
import { formatearDuracion } from "@/utils/duracion";

const AVISO_SIN_LUGAR =
  "No se pudo activar: revisa el permiso de ubicación y que la ubicación del teléfono esté " +
  "encendida. Las notas se seguirán guardando, sin lugar.";

async function guardar(audio: AudioGrabado, conLugar: boolean): Promise<string> {
  const deps = await obtenerDependencias();
  const resultado = await guardarGrabacion(deps, {
    uriTemporal: audio.uri,
    duracionMs: audio.duracionMs,
    titulo: "",
    etiqueta: null,
    lugar: conLugar ? await obtenerLugar() : null,
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

/** El permiso de ubicación se pide aquí, cuando el usuario activa la función. */
function useInterruptorLugar(cambiarAjustes: (cambios: Partial<Ajustes>) => void) {
  const [aviso, setAviso] = useState<string | null>(null);

  const cambiar = useCallback(
    (deseado: boolean) => {
      setAviso(null);
      if (!deseado) {
        cambiarAjustes({ guardarLugar: false });
        return;
      }
      pedirPermisoUbicacion()
        .then((concedido) => {
          cambiarAjustes({ guardarLugar: concedido });
          setAviso(concedido ? null : AVISO_SIN_LUGAR);
        })
        .catch(() => setAviso(AVISO_SIN_LUGAR));
    },
    [cambiarAjustes],
  );

  return { aviso, cambiar };
}

export default function PantallaGrabar() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { ajustes, cambiar } = useAjustes();
  const lugar = useInterruptorLugar(cambiar);

  const mostrar = useCallback((tarea: Promise<string>) => {
    tarea.then(setMensaje).catch(() => setMensaje("No se pudo completar. Inténtalo de nuevo."));
  }, []);
  const alTerminar = useCallback(
    (audio: AudioGrabado) => mostrar(guardar(audio, ajustes.guardarLugar)),
    [mostrar, ajustes.guardarLugar],
  );
  const alDescartar = useCallback((uri: string) => mostrar(descartar(uri)), [mostrar]);

  return (
    <Grabadora
      alTerminar={alTerminar}
      alDescartar={alDescartar}
      mensaje={mensaje}
      calidad={ajustes.calidad}
      limiteMs={ajustes.limiteMs}
      pie={
        <InterruptorLugar
          activo={ajustes.guardarLugar}
          aviso={lugar.aviso}
          alCambiar={lugar.cambiar}
        />
      }
    />
  );
}
