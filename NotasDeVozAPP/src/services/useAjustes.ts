import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { type Ajustes, AJUSTES_POR_DEFECTO } from "@/utils/ajustes";
import { cambiarAjustes, obtenerAjustes } from "./ajustesServicio";
import { obtenerDependencias } from "./dependencias";

/**
 * Ajustes de la app para una pantalla: se vuelven a leer cada vez que la pantalla recibe
 * el foco, así un cambio hecho en Ajustes se ve al volver a Grabar.
 */
export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_POR_DEFECTO);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      obtenerDependencias()
        .then(obtenerAjustes)
        .then((leidos) => vigente && setAjustes(leidos))
        .catch(() => undefined);
      return () => {
        vigente = false;
      };
    }, []),
  );

  const cambiar = useCallback((cambios: Partial<Ajustes>) => {
    // Se refleja de inmediato en pantalla y luego se confirma con lo que quedó guardado.
    setAjustes((actuales) => ({ ...actuales, ...cambios }));
    obtenerDependencias()
      .then((deps) => cambiarAjustes(deps, cambios))
      .then(setAjustes)
      .catch(() => undefined);
  }, []);

  return { ajustes, cambiar };
}
