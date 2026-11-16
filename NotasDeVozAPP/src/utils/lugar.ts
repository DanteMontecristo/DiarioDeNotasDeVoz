export type Direccion = {
  city: string | null;
  district: string | null;
  subregion: string | null;
  region: string | null;
  country: string | null;
};

/** El nombre más preciso disponible para un lugar: ciudad y, si falta, lo que le siga. */
export function nombreDelLugar(direccion: Direccion | undefined): string | null {
  if (!direccion) {
    return null;
  }
  const candidatos = [
    direccion.city,
    direccion.district,
    direccion.subregion,
    direccion.region,
    direccion.country,
  ];
  return candidatos.map((texto) => texto?.trim()).find((texto) => texto) ?? null;
}

export function formatearCoordenadas(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
