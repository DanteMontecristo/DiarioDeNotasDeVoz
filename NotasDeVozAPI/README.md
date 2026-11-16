# API · Diario de notas de voz

API en Next.js (Route Handlers) que se despliega en Vercel. Media la autenticación con
Firebase y guarda los metadatos de las notas de voz en Firestore.

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # servidor de desarrollo
npm run check   # typecheck + lint + format:check + test (con cobertura)
```

## Variables de entorno

Vea `env.example`. Las claves reales viven únicamente en Vercel.

## Estructura

```text
app/api/**/route.ts   rutas de la API
lib/                  utilidades comunes (errores, validación, entorno, Firebase)
```

## Dependencias y por qué están

| Paquete                              | Para qué se usa                                                 |
| ------------------------------------ | --------------------------------------------------------------- |
| `next`, `react`, `react-dom`         | Marco de la API (Route Handlers); React es requisito de Next.   |
| `firebase-admin`                     | Verificar ID tokens y leer/escribir Firestore desde el servidor |
| `zod`                                | Validar todo lo que entra y descartar campos no declarados      |
| `typescript`, `@types/*`             | Tipado estricto                                                 |
| `eslint`, `eslint-config-next`       | Reglas de calidad automáticas                                   |
| `prettier`, `eslint-config-prettier` | Formato único, sin choques con ESLint                           |
| `vitest`, `@vitest/coverage-v8`      | Pruebas y umbral de cobertura del 80 %                          |
