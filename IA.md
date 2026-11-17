# Uso de IA en el proyecto · índice de evidencias

Proyecto 31 · Diario de notas de voz. La IA se configuró **antes** de generar código: la
configuración está en el primer commit del repositorio (`746f2d2`).

## Dónde está cada cosa

| Evidencia                                        | Archivo                                                      | Estado                               |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------ |
| Reglas del proyecto para la IA                   | [`AGENTS.md`](AGENTS.md) y [`CLAUDE.md`](CLAUDE.md)          | Hecho                                |
| Permisos que hace cumplir el programa            | [`.claude/settings.json`](.claude/settings.json)             | Hecho                                |
| Qué riesgo cubre cada barrera, límites y ajustes | [`ia/CONFIGURACION.md`](ia/CONFIGURACION.md)                 | Hecho                                |
| Las 10 pruebas de contención                     | [`ia/PRUEBAS-CONTENCION.md`](ia/PRUEBAS-CONTENCION.md)       | **Por ejecutar**, con capturas       |
| Bitácora de IA y casos rechazados o corregidos   | [`ia/BITACORA.md`](ia/BITACORA.md)                           | **Borrador**, falta reescribirla     |
| Salida de `npm run check` (API)                  | [`ia/evidencias/check-api.txt`](ia/evidencias/check-api.txt) | Hecho                                |
| Salida de `npm run check` (app)                  | [`ia/evidencias/check-app.txt`](ia/evidencias/check-app.txt) | Hecho                                |
| CI en verde                                      | Pestaña **Actions** del repositorio en GitHub                | **Falta pegar aquí el enlace**       |
| Retos de excelencia de IA (mínimo 2)             | —                                                            | **Pendiente de elegir y documentar** |

## Cómo comprobar que la configuración fue lo primero

```bash
git log --reverse --oneline | head -1
git show --stat 746f2d2
```

El primer commit contiene `AGENTS.md`, `.claude/settings.json`, `.gitignore`, los `env.example`
y los scripts de calidad, y ningún código de la app ni de la API.

## Demostración en vivo

En la sustentación se pedirá a la IA leer `.env.local` y salir de la carpeta (debe fallar), y
explicar un fragmento de código generado con IA. Las pruebas 1, 2 y 5 de
`ia/PRUEBAS-CONTENCION.md` son las que conviene tener ensayadas.
