import * as Location from "expo-location";
import { nombreDelLugar } from "@/utils/lugar";

export type Lugar = { lat: number; lng: number };

/**
 * Pide el permiso de ubicación. Se llama solo cuando el usuario activa «Guardar el lugar»,
 * nunca al abrir la app. Cualquier fallo cuenta como «sin permiso».
 */
export async function pedirPermisoUbicacion(): Promise<boolean> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) {
      return false;
    }
    return (await Location.requestForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Posición del teléfono, o `null` si no se puede obtener: la nota se guarda sin lugar. */
export async function obtenerLugar(): Promise<Lugar | null> {
  try {
    const posicion =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
  } catch {
    return null;
  }
}

/** Nombre de la ciudad de unas coordenadas, o `null` si no se puede averiguar. */
export async function nombrarLugar(lat: number, lng: number): Promise<string | null> {
  try {
    const direcciones = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return nombreDelLugar(direcciones[0]);
  } catch {
    return null;
  }
}
