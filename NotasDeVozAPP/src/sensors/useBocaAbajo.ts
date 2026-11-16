import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { estaBocaAbajo } from "@/utils/orientacion";

const INTERVALO_MS = 300;

/**
 * Llama a `alVoltear` cuando el teléfono pasa a estar boca abajo. Solo escucha el
 * acelerómetro mientras `activo` es verdadero y cancela la suscripción al dejar de usarlo.
 * Si el teléfono no tiene acelerómetro, no hace nada: queda el botón de pausa.
 */
export function useBocaAbajo(activo: boolean, alVoltear: () => void): void {
  const accion = useRef(alVoltear);
  useEffect(() => {
    accion.current = alVoltear;
  }, [alVoltear]);

  useEffect(() => {
    if (!activo) {
      return;
    }
    let vigente = true;
    let estabaBocaAbajo = false;
    let suscripcion: { remove: () => void } | null = null;

    Accelerometer.isAvailableAsync()
      .then((disponible) => {
        if (!disponible || !vigente) {
          return;
        }
        Accelerometer.setUpdateInterval(INTERVALO_MS);
        suscripcion = Accelerometer.addListener(({ z }) => {
          const ahora = estaBocaAbajo(z, Platform.OS);
          if (ahora && !estabaBocaAbajo) {
            accion.current();
          }
          estabaBocaAbajo = ahora;
        });
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
      suscripcion?.remove();
    };
  }, [activo]);
}
