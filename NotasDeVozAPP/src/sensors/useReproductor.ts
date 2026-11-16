import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import { type Direccion, posicionConSalto, siguienteVelocidad } from "@/utils/reproductor";
import { useBocaAbajo } from "./useBocaAbajo";

export type EstadoReproductor = {
  reproduciendo: boolean;
  posicionMs: number;
  duracionMs: number;
  velocidad: number;
  alternar: () => void;
  saltar: (direccion: Direccion) => void;
  irA: (posicionMs: number) => void;
  cambiarVelocidad: () => void;
};

const MS_POR_SEGUNDO = 1000;

function sinFallar(promesa: Promise<unknown>): void {
  promesa.catch(() => undefined);
}

/**
 * Reproduce el audio de una nota. `duracionGuardadaMs` es la duración registrada al grabar:
 * se usa mientras el reproductor todavía no ha leído la del archivo.
 */
export function useReproductor(uri: string, duracionGuardadaMs: number): EstadoReproductor {
  const reproductor = useAudioPlayer({ uri });
  const estado = useAudioPlayerStatus(reproductor);
  const [velocidad, setVelocidad] = useState(1);
  const posicionMs = Math.round(estado.currentTime * MS_POR_SEGUNDO);
  const duracionMs = estado.duration > 0 ? estado.duration * MS_POR_SEGUNDO : duracionGuardadaMs;

  useEffect(() => {
    // La grabadora deja el audio en modo de grabación; aquí vuelve al modo de reproducción.
    sinFallar(setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }));
  }, []);

  useEffect(() => {
    if (estado.didJustFinish) {
      reproductor.pause();
      sinFallar(reproductor.seekTo(0));
    }
  }, [estado.didJustFinish, reproductor]);

  // Poner el teléfono boca abajo pausa; la alternativa sin sensor es el botón Pausar.
  const pausar = useCallback(() => reproductor.pause(), [reproductor]);
  useBocaAbajo(estado.playing, pausar);

  const irA = useCallback(
    (destinoMs: number) => sinFallar(reproductor.seekTo(destinoMs / MS_POR_SEGUNDO)),
    [reproductor],
  );
  const saltar = useCallback(
    (direccion: Direccion) => irA(posicionConSalto(posicionMs, duracionMs, direccion)),
    [irA, posicionMs, duracionMs],
  );
  const alternar = useCallback(() => {
    if (estado.playing) {
      reproductor.pause();
    } else {
      reproductor.play();
    }
  }, [estado.playing, reproductor]);
  const cambiarVelocidad = useCallback(() => {
    const nueva = siguienteVelocidad(velocidad);
    reproductor.setPlaybackRate(nueva);
    setVelocidad(nueva);
  }, [reproductor, velocidad]);

  return {
    reproduciendo: estado.playing,
    posicionMs,
    duracionMs,
    velocidad,
    alternar,
    saltar,
    irA,
    cambiarVelocidad,
  };
}
