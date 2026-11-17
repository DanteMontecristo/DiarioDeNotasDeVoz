# Configuración de la IA: qué cubre cada barrera y dónde se queda corta

La herramienta usada es **Claude Code**, abierta siempre en la raíz del repositorio.
La configuración vive en dos lugares, ambos en el primer commit (`746f2d2`):

- `AGENTS.md` (y `CLAUDE.md`, que solo lo importa): reglas del proyecto. **Orientan, no protegen.**
- `.claude/settings.json`: permisos que **hace cumplir el programa**, aunque la IA quiera otra cosa.

## 1. Barreras y riesgo que cubre cada una

| Barrera en `.claude/settings.json`                                                                                        | Riesgo que cubre                                                         | Límite conocido                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `deny` de `Read` y `Edit` sobre `.env*`, `*.pem`, `*.key`, `*firebase-adminsdk*.json`, `*.keystore`, `*.jks`              | Que la IA lea, copie o modifique secretos                                | Solo ve las herramientas de archivos: un script o un comando que abra el archivo no pasa por esta regla |
| `permissions.blockReadsOutsideWorkingDirectories`                                                                         | Que la IA lea otros proyectos o la carpeta personal                      | Aplica a las herramientas de archivos, no a todo lo que haga un comando                                 |
| `permissions.blockWritesOutsideWorkingDirectories`                                                                        | Que la IA escriba fuera del repositorio o cambie su propia configuración | Igual que la anterior                                                                                   |
| `deny` de `Edit(./.claude/**)`                                                                                            | Que la IA modifique su propia jaula                                      | —                                                                                                       |
| `permissions.disableBypassPermissionsMode`                                                                                | Que se use el modo sin permisos                                          | —                                                                                                       |
| `deny` de `sudo`, `rm -rf`, `curl`, `wget`, `git push --force`, `git reset --hard`, `vercel env pull` (Bash y PowerShell) | Acciones destructivas, descargas y bajar secretos de producción          | Una regla de comando **no es una frontera**: `/usr/bin/curl` o `sh -c '…'` no coinciden con `curl *`    |
| `ask` de `git push`, instalar dependencias, `vercel`, `eas`, `WebFetch`                                                   | Que algo salga de la máquina sin que una persona lo apruebe              | Depende de que la persona lea lo que aprueba                                                            |

Orden de evaluación: **deny → ask → allow**. Una regla `allow` no abre excepciones dentro de un `deny`.

## 2. Lo que no hay: el sandbox

La hoja del curso pide un sandbox (`sandbox.enabled`, `failIfUnavailable`…). **Este proyecto no
lo tiene**, por dos razones que conviene poder explicar:

1. El sandbox de Claude Code no existe en Windows nativo; solo en macOS, Linux y WSL2.
2. El profesor indicó en clase ignorar la instrucción de trabajar en WSL2.

Consecuencia honesta: las barreras de este proyecto son **permisos**, no aislamiento. Lo que un
comando haga por dentro (un `node -e` que lea un archivo, un `grep -r`) no lo detiene ninguna
regla de `Read`. Por eso se combinan capas:

- permisos (esta configuración);
- **ningún secreto real en el disco de desarrollo**: las claves viven solo en Vercel, y el `.env`
  de la app contiene únicamente la URL pública de la API;
- revisión humana de cada diff y de cada permiso que se aprueba.

Para cerrar ese hueco sin sandbox, el siguiente paso sería un hook `PreToolUse` propio (reto de
excelencia 10) que bloquee comandos que nombren `.env*` o rutas fuera del proyecto.

## 3. Ajustes hechos y por qué

| Cambio                                                      | Motivo                                                                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Se quitó el bloque `sandbox` completo                       | Con `allowUnsandboxedCommands: false` en Windows nativo no se podía ejecutar **ningún** comando; con `failIfUnavailable: true` Claude Code ni siquiera arrancaba |
| Las reglas de comandos se duplicaron para `PowerShell(...)` | En Windows la IA también ejecuta PowerShell, y una regla `Bash(...)` no la cubre                                                                                 |
| Se agregó `Edit(./.claude/**)` a mano                       | La IA no puede editar su propia configuración, así que este cambio lo hizo una persona                                                                           |
| `env.example` sin punto inicial                             | `Read(**/.env*)` también bloquearía un `.env.example`                                                                                                            |
| `tsconfig.json` fuera de Prettier                           | Expo y Next lo reescriben con su formato y rompían `format:check`                                                                                                |
| `.gitattributes` con finales de línea LF                    | Git en Windows convertía a CRLF y Prettier exige LF                                                                                                              |

## 4. Reglas de calidad automáticas

`npm run check` = `typecheck` + `lint` + `format:check` + `test`, en cada proyecto.

- TypeScript `strict` y `noUncheckedIndexedAccess`.
- ESLint en `error`: complejidad ≤ 10, funciones ≤ 50 líneas, anidación ≤ 3, archivos ≤ 300
  líneas, `no-console`, `eqeqeq`, sin `any` ni `@ts-ignore`.
- Cobertura mínima del 80 % configurada: bajarla rompe el `check`.
- **Husky + lint-staged**: al hacer commit se formatea y revisa lo modificado; al hacer push corre
  `npm run check` completo.
- **CI** en GitHub Actions para la API y la app: `npm ci` → `check` → compilación →
  `npm audit --audit-level=high`.

La salida real del `check` está en `ia/evidencias/`.

## 5. MCP

Ninguno configurado ni autorizado en el proyecto.
