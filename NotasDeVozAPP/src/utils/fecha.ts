function dosCifras(valor: number): string {
  return String(valor).padStart(2, "0");
}

/** Convierte una fecha ISO en `dd/mm/aaaa hh:mm`, en la hora local del teléfono. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (iso === "" || Number.isNaN(fecha.getTime())) {
    return "";
  }
  const dia = `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
  return `${dia} ${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}
