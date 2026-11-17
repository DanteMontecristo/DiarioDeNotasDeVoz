# API · Diario de notas de voz

API en Next.js (Route Handlers) que se despliega en Vercel. Media la autenticación con
Firebase y guarda los metadatos de las notas de voz en Firestore.

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # servidor de desarrollo
npm run check   # typecheck + lint + format:check + test (con cobertura)
```

## Versión de Node

La API necesita **Node 22**: `firebase-admin` depende de un módulo que versiones anteriores
no pueden cargar (falla con `ERR_REQUIRE_ESM`). `package.json` lo fija en `engines` y Vercel
lo respeta al desplegar.

## Variables de entorno

Vea `env.example`. Las claves reales viven únicamente en Vercel.

## Estructura

```text
app/api/**/route.ts   rutas de la API
lib/                  utilidades comunes (errores, validación, entorno, Firebase, sesión)
lib/notas-voz/        esquema, repositorio de Firestore y cálculo del resumen
pruebas/              Firestore en memoria y pruebas de la configuración
```

## Rutas

| Método y ruta                        | Qué hace                                               |
| ------------------------------------ | ------------------------------------------------------ |
| `GET /api/health`                    | Comprobar que la API responde                          |
| `POST /api/auth/registro`            | Crear cuenta (contraseña de 8 o más caracteres)        |
| `POST /api/auth/login`               | Iniciar sesión                                         |
| `POST /api/auth/refresh`             | Renovar el token                                       |
| `GET /api/auth/yo`                   | Usuario del token                                      |
| `GET /api/notas-voz?since=<ISO>`     | Notas modificadas después de `since` (máx. 500)        |
| `PUT /api/notas-voz/<id>`            | Crear o reemplazar una nota (`id` es un UUID)          |
| `DELETE /api/notas-voz/<id>`         | Borrado lógico                                         |
| `GET /api/notas-voz/resumen?semana=` | Minutos por día; acepta `desfase_min` (Colombia: -300) |

Todas, salvo `health`, `registro`, `login` y `refresh`, exigen `Authorization: Bearer <token>`.

## Firestore

- `firestore.rules` niega toda lectura y escritura a los clientes: solo la API accede,
  con el Admin SDK.
- `firestore.indexes.json` no declara índices compuestos porque ninguna consulta los
  necesita: cada una filtra y ordena por un solo campo (`updated_at` o `grabada_en`).
- Para publicarlas hace falta la CLI de Firebase (no está instalada en este proyecto):
  `firebase deploy --only firestore`. Lo ejecuta una persona, no la IA.

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
