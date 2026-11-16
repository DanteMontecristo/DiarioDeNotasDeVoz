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
src/components/    UI reutilizable y accesible
```

## Dependencias y por qué están

| Paquete                                                  | Para qué se usa                                     |
| -------------------------------------------------------- | --------------------------------------------------- |
| `expo`, `react`, `react-native`                          | Base de la app                                      |
| `expo-router`                                            | Navegación por archivos (pestañas y pantallas)      |
| `react-native-screens`, `react-native-safe-area-context` | Requisitos de la navegación                         |
| `expo-linking`, `expo-constants`                         | Requisitos de Expo Router                           |
| `expo-status-bar`                                        | Barra de estado del sistema                         |
| `react-native-gesture-handler`                           | Gestos (mantener presionado, deslizar, doble toque) |
| `react-native-reanimated`, `react-native-worklets`       | Animaciones ligadas a los gestos                    |
| `typescript`, `@types/*`                                 | Tipado estricto                                     |
| `eslint`, `eslint-config-expo`                           | Reglas de calidad automáticas                       |
| `prettier`, `eslint-config-prettier`                     | Formato único, sin choques con ESLint               |
| `jest`, `jest-expo`, `@react-native/jest-preset`         | Pruebas y umbral de cobertura del 80 %              |
| `@testing-library/react-native`, `test-renderer`         | Pruebas de componentes como las usaría una persona  |
