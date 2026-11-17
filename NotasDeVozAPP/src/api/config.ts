/**
 * URL pública de la API. Es lo único configurable de la app y no es un secreto:
 * todo lo que empieza por `EXPO_PUBLIC_` queda dentro del APK.
 */
export function resolverUrlApi(valor: string | undefined): string {
  const url = (valor ?? "").trim().replace(/\/+$/, "");
  if (url === "") {
    throw new Error("Falta configurar EXPO_PUBLIC_API_URL con la dirección de la API.");
  }
  if (!url.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_URL debe empezar por https://");
  }
  return url;
}

export function urlApi(): string {
  return resolverUrlApi(process.env.EXPO_PUBLIC_API_URL);
}
