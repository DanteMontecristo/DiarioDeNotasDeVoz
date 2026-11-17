# Diario de notas de voz

Proyecto 31 de Desarrollo Móvil. App para grabar notas de voz de hasta 2 minutos, ponerles
título, etiqueta y lugar, y reproducirlas a distintas velocidades. Funciona sin conexión y,
con una cuenta, respalda los datos de las notas en una API propia.

La especificación completa está en [`31-notas-de-voz.md`](31-notas-de-voz.md).

## Estructura del repositorio

| Carpeta                           | Qué contiene                                                       |
| --------------------------------- | ------------------------------------------------------------------ |
| [`NotasDeVozAPP/`](NotasDeVozAPP) | App móvil: Expo, React Native, Expo Router y SQLite local          |
| [`NotasDeVozAPI/`](NotasDeVozAPI) | API: Next.js (Route Handlers) en Vercel, Firebase Auth y Firestore |
| [`ia/`](ia) e [`IA.md`](IA.md)    | Evidencias de la configuración y del uso de IA                     |
| [`.github/`](.github)             | CI de GitHub Actions y plantilla de PR                             |

Cada proyecto tiene su propio `README` con sus comandos, su estructura y la justificación de
cada dependencia. El `package.json` de la raíz solo instala los hooks de Git.

## Arquitectura

```text
[ App móvil ]  SQLite local · funciona sin conexión
      │  HTTPS + ID token de Firebase (guardado en expo-secure-store)
      ▼
[ API en Vercel ]  variables de entorno solo en Vercel
      │
      ▼
[ Firebase ]  Authentication + Firestore (solo vía Admin SDK)
```

La app **no contiene ninguna credencial**: solo conoce la URL pública de la API. El audio se
queda en el teléfono; a la API viajan únicamente los datos de cada nota.

## Puesta en marcha

Requisitos: Node 22 y, en el teléfono, la app Expo Go.

```bash
npm install                      # en la raíz: activa los hooks de Git
cd NotasDeVozAPI && npm install  # dependencias de la API
cd ../NotasDeVozAPP && npm install
```

Para la app, cree `NotasDeVozAPP/.env` con la URL pública de la API (vea `env.example`) y ejecute:

```bash
npx expo start
```

## Calidad

En cada proyecto, `npm run check` ejecuta tipos, lint, formato y pruebas con cobertura. Los
hooks de Git lo corren antes de cada push, y la CI lo repite en GitHub junto con la compilación
y la auditoría de dependencias.

## Funciones

- Grabar manteniendo presionado; soltar guarda y deslizar a la izquierda cancela.
- Lista con búsqueda por título o etiqueta.
- Reproductor con velocidades 1×, 1,5× y 2×, barra arrastrable y doble toque para saltar 10 s.
- Renombrar, etiquetar, eliminar y compartir.
- Sensores: micrófono, acelerómetro (boca abajo pausa) y ubicación (ciudad de la nota).
- Ajustes de calidad y límite de tiempo.
- Cuenta opcional con sincronización y resumen semanal.

Cada gesto tiene una alternativa por botón con etiqueta de accesibilidad.

## Capturas

<!-- Pendiente: agregar capturas de la lista, la grabadora, el reproductor y la cuenta. -->

## Entregables

- URL de la API: <https://diario-de-notas-de-voz.vercel.app>
- APK: pendiente (EAS Build)
