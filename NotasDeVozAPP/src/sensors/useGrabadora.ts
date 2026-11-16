import {
  type AudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { Calidad } from "@/utils/ajustes";
import { nivelDesdeMedidor } from "@/utils/grabadora";

export type AudioGrabado = { uri: string; duracionMs: number };

export type EstadoGrabadora = {
  grabando: boolean;
  duracionMs: number;
  /** Nivel de voz de 0 a 1. */
  nivel: number;
  permisoNegado: boolean;
  iniciar: () => void;
  /** Detiene la grabación; con `guardar` en `false` se descarta. */
  terminar: (guardar: boolean) => void;
};

type Opciones = {
  alTerminar: (audio: AudioGrabado) => void;
  alDescartar: (uri: string) => void;
  calidad: Calidad;
  /** La grabación se detiene y se guarda sola al llegar a este límite. */
  limiteMs: number;
};

type Destinos = Pick<Opciones, "alTerminar" | "alDescartar">;
type Fase = "inactiva" | "iniciando" | "grabando";

function opcionesDe(calidad: Calidad) {
  const base = calidad === "baja" ? RecordingPresets.LOW_QUALITY : RecordingPresets.HIGH_QUALITY;
  return { ...base, isMeteringEnabled: true };
}
const INTERVALO_DE_ESTADO_MS = 100;
const ETIQUETA_PANTALLA = "grabando-nota";

/** Vibración y pantalla encendida son un extra: si el teléfono no las tiene, se ignoran. */
function sinFallar(promesa: Promise<unknown>): void {
  promesa.catch(() => undefined);
}

async function empezar(grabador: AudioRecorder, calidad: Calidad): Promise<void> {
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  await grabador.prepareToRecordAsync(opcionesDe(calidad));
  grabador.record();
  sinFallar(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  sinFallar(activateKeepAwakeAsync(ETIQUETA_PANTALLA));
}

async function detener(grabador: AudioRecorder): Promise<AudioGrabado | null> {
  const duracionMs = grabador.getStatus().durationMillis;
  await grabador.stop();
  sinFallar(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  sinFallar(deactivateKeepAwake(ETIQUETA_PANTALLA));
  return grabador.uri ? { uri: grabador.uri, duracionMs } : null;
}

/** Pide el permiso de micrófono y, si se concede, empieza a grabar. */
async function pedirPermisoYGrabar(grabador: AudioRecorder, calidad: Calidad): Promise<boolean> {
  const permiso = await requestRecordingPermissionsAsync();
  if (permiso.granted) {
    await empezar(grabador, calidad);
  }
  return permiso.granted;
}

async function finalizar(grabador: AudioRecorder, guardar: boolean, opciones: Destinos) {
  const audio = await detener(grabador);
  if (!audio) {
    return;
  }
  if (guardar) {
    opciones.alTerminar(audio);
  } else {
    opciones.alDescartar(audio.uri);
  }
}

/** Arranque y cierre de la grabación, incluido soltar el botón antes de que arranque. */
function useControl(grabador: AudioRecorder, opciones: Opciones) {
  const { alTerminar, alDescartar, calidad } = opciones;
  const [permisoNegado, setPermisoNegado] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const fase = useRef<Fase>("inactiva");
  // Si se suelta el botón mientras la grabación aún arranca, se recuerda qué hacer al arrancar.
  const cierrePendiente = useRef<boolean | null>(null);

  const cerrar = useCallback(
    (guardar: boolean) => {
      fase.current = "inactiva";
      setGrabando(false);
      sinFallar(finalizar(grabador, guardar, { alTerminar, alDescartar }));
    },
    [grabador, alTerminar, alDescartar],
  );

  const terminar = useCallback(
    (guardar: boolean) => {
      if (fase.current === "iniciando") {
        cierrePendiente.current = guardar;
      } else if (fase.current === "grabando") {
        cerrar(guardar);
      }
    },
    [cerrar],
  );

  const alArrancar = useCallback(
    (concedido: boolean) => {
      setPermisoNegado(!concedido);
      fase.current = concedido ? "grabando" : "inactiva";
      setGrabando(concedido);
      if (concedido && cierrePendiente.current !== null) {
        cerrar(cierrePendiente.current);
      }
    },
    [cerrar],
  );

  const iniciar = useCallback(() => {
    if (fase.current !== "inactiva") {
      return;
    }
    fase.current = "iniciando";
    cierrePendiente.current = null;
    pedirPermisoYGrabar(grabador, calidad)
      .then(alArrancar)
      .catch(() => {
        // Falló el micrófono, no el permiso: se vuelve al reposo sin culpar al permiso.
        fase.current = "inactiva";
        setGrabando(false);
      });
  }, [grabador, calidad, alArrancar]);

  return { grabando, permisoNegado, iniciar, terminar };
}

/**
 * Graba con el micrófono. Pide el permiso la primera vez que se intenta grabar,
 * corta a los 2 minutos y, si la app pasa a segundo plano, detiene y guarda.
 */
export function useGrabadora(opciones: Opciones): EstadoGrabadora {
  const grabador = useAudioRecorder(opcionesDe(opciones.calidad));
  const estado = useAudioRecorderState(grabador, INTERVALO_DE_ESTADO_MS);
  const { grabando, permisoNegado, iniciar, terminar } = useControl(grabador, opciones);

  useEffect(() => {
    if (grabando && estado.durationMillis >= opciones.limiteMs) {
      terminar(true);
    }
  }, [grabando, estado.durationMillis, opciones.limiteMs, terminar]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (siguiente) => {
      if (siguiente !== "active") {
        terminar(true);
      }
    });
    return () => suscripcion.remove();
  }, [terminar]);

  return {
    grabando,
    duracionMs: grabando ? estado.durationMillis : 0,
    nivel: grabando ? nivelDesdeMedidor(estado.metering) : 0,
    permisoNegado,
    iniciar,
    terminar,
  };
}
