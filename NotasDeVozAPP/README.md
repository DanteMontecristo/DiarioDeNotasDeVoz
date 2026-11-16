# APP · Diario de notas de voz

App móvil (Expo + React Native + Expo Router) para grabar notas de voz de hasta 2 minutos.

## Comandos

```bash
npm install      # instalar dependencias
npx expo start   # servidor de desarrollo; escanee el QR con Expo Go
npm run check    # typecheck + lint + format:check + test (con cobertura)
```

## Variables de entorno

Vea `env.example`. La app solo conoce la URL pública de la API (`EXPO_PUBLIC_API_URL`):
no contiene ninguna credencial.

## Estructura

```text
app/               rutas de Expo Router: (tabs)/index, (tabs)/grabar, nota/[id], ajustes
src/db/            abrir SQLite y migraciones
src/repositories/  SQL parametrizado (único lugar con SQL)
src/services/      reglas de negocio (guardar, renombrar y eliminar notas)
src/utils/         reglas puras (duración, título, etiqueta)
src/sensors/       hooks del micrófono y del reproductor
src/components/    UI reutilizable y accesible
pruebas/           SQLite en memoria para las pruebas
```

## Dependencias y por qué están

| Paquete                                                  | Para qué se usa                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `expo`, `react`, `react-native`                          | Base de la app                                                    |
| `expo-router`                                            | Navegación por archivos (pestañas y pantallas)                    |
| `react-native-screens`, `react-native-safe-area-context` | Requisitos de la navegación                                       |
| `expo-linking`, `expo-constants`                         | Requisitos de Expo Router                                         |
| `expo-status-bar`                                        | Barra de estado del sistema                                       |
| `expo-sqlite`                                            | Base de datos local: la app funciona sin conexión                 |
| `expo-audio`                                             | Grabar y reproducir las notas de voz                              |
| `expo-file-system`                                       | Guardar el audio en una carpeta persistente y borrarlo            |
| `expo-crypto`                                            | Generar el identificador (UUID) de cada nota                      |
| `expo-haptics`                                           | Vibración corta al empezar y terminar de grabar                   |
| `expo-keep-awake`                                        | Mantener la pantalla encendida mientras se graba                  |
| `expo-sharing`                                           | Compartir el archivo de audio de una nota                         |
| `expo-sensors`                                           | Acelerómetro: pausar al poner el teléfono boca abajo              |
| `expo-location`                                          | Guardar el lugar donde se grabó la nota, si el usuario lo activa  |
| `react-dom`                                              | Lo exige Expo Router; se fija a la misma versión que `react`      |
| `react-native-gesture-handler`                           | Gestos (mantener presionado, deslizar, doble toque)               |
| `react-native-reanimated`, `react-native-worklets`       | Animaciones ligadas a los gestos                                  |
| `typescript`, `@types/*`                                 | Tipado estricto; `@types/node` solo para el SQLite de las pruebas |
| `eslint`, `eslint-config-expo`                           | Reglas de calidad automáticas                                     |
| `prettier`, `eslint-config-prettier`                     | Formato único, sin choques con ESLint                             |
| `jest`, `jest-expo`, `@react-native/jest-preset`         | Pruebas y umbral de cobertura del 80 %                            |
| `@testing-library/react-native`, `test-renderer`         | Pruebas de componentes como las usaría una persona                |
