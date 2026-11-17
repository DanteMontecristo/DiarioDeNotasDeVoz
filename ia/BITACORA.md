# Bitácora de uso de IA

> **Borrador.** Lo redactó la IA a partir de lo que ocurrió en las sesiones de trabajo, para no
> perder los hechos. Antes de entregar, cada integrante debe **reescribirlo con sus palabras**,
> corregir lo que no recuerde así y completar la columna «Qué entendí»: en la sustentación se
> pide explicar el código generado, y eso no lo puede escribir la IA.

Herramienta: Claude Code. Todas las entradas son del 16 de noviembre de 2026.
Cada entrada sigue el formato **propósito → evidencia → validación → decisión**.

## Entradas

| #   | Propósito                                                    | Evidencia                                                                                        | Validación                                                               | Decisión                                     | Qué entendí |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------- | ----------- |
| 1   | Configurar la IA antes de generar código                     | `746f2d2`: `AGENTS.md`, `.claude/settings.json`, `.gitignore`, `env.example`, scripts de calidad | JSON válido; reglas revisadas contra la documentación de Claude Code     | Aceptado, tras quitar el sandbox (rechazo 1) |             |
| 2   | Construir la API paso a paso, con la prueba antes del código | `979b951` a `51cc918`                                                                            | `npm run check` en verde en cada paso; cobertura 100 % de líneas         | Aceptado                                     |             |
| 3   | Registro de errores sin datos sensibles y códigos 413/415    | `aac0006`, `0eb9e9e`                                                                             | Pruebas que verifican que se ocultan tokens, claves y correos            | Aceptado                                     |             |
| 4   | Hooks de Git y CI                                            | `b4ff2d2`, `d4dc09e`                                                                             | Se intentó un commit con `any`, `console.log` y `==`: el hook lo rechazó | Aceptado                                     |             |
| 5   | Base de la app, SQLite y reglas de negocio                   | `0bd6640` a `abb593e`                                                                            | SQL probado contra SQLite real en memoria; app abierta en el teléfono    | Aceptado                                     |             |
| 6   | Grabación, lista, reproductor, sensores y ajustes            | `973ebb3` a `c1f3868`                                                                            | Cada pantalla se probó a mano en el teléfono antes del commit            | Aceptado                                     |             |
| 7   | Corregir el error 500 de la API en Vercel                    | `7b61898`, `386e8f8`                                                                             | Se reprodujo el fallo en el PC y se comprobó la corrección en Vercel     | Aceptado al segundo intento (corrección 4)   |             |
| 8   | Inicio de sesión y sincronización                            | `1fc6cf1`, `a29880a`                                                                             | Probado contra la API real: enviar, recibir, editar, eliminar y resumen  | Aceptado                                     |             |

## Casos en que se rechazó o corrigió lo que propuso la IA

La hoja del curso pide al menos tres. Estos ocurrieron de verdad:

### 1. Sandbox que dejaba el proyecto sin poder ejecutar comandos — rechazado

- **Qué propuso la IA:** un bloque `sandbox` en modo estricto, como pedía la hoja.
- **Qué pasó:** en Windows nativo no existe sandbox, y con ese modo ningún comando se ejecutaba.
  En otro PC, Claude Code ni arrancaba («No hay un sandbox requerido disponible»).
- **Decisión:** se quitó el bloque completo, a mano, porque la IA no puede editar su configuración.
- **Aprendizaje:** una configuración copiada de una hoja puede no servir en el sistema propio.

### 2. Generar el proyecto con la plantilla de Expo sin que se pidiera — rechazado

- **Qué propuso la IA:** ejecutar `create-expo-app` cuando solo se había pedido lo necesario
  para el primer commit.
- **Decisión:** se interrumpió el comando y se pidió eliminar lo generado. La regla que prohíbe
  `rm -rf` le impidió a la IA borrarlo, y la carpeta se limpió a mano.
- **Aprendizaje:** el alcance lo decide la persona; y la regla de `rm -rf` funcionó.

### 3. Archivo con datos personales en el commit — corregido

- **Qué pasó:** el primer commit incluyó `proyectos-y-sorteo.html`, con los nombres completos
  de todo el grupo.
- **Decisión:** se rehízo el commit sin ese archivo y se agregó a `.gitignore`, antes de subir
  nada a GitHub.

### 4. Corrección equivocada del error 500 — corregida

- **Qué propuso la IA:** fijar Node 22 en la API, suponiendo que esa era la causa.
- **Qué pasó:** se desplegó y el error siguió igual.
- **Decisión:** se le exigió reproducir el fallo antes de volver a proponer. La causa real era
  una dependencia (`jose` 6) que Vercel no puede cargar; se forzó la versión 5.
- **Aprendizaje:** las pruebas de la IA simulaban Firebase y por eso nunca cargaron el paquete
  real. Un `check` en verde no garantiza que funcione en producción.

### 5. Pruebas que fallaban por errores de la propia IA — corregidas

- En varias entregas las pruebas escritas por la IA tenían errores (datos repetidos, una
  expresión mal escrita, textos que no coincidían). En todos los casos se revisó que el arreglo
  fuera en la prueba mal hecha y **no** un cambio para «hacer pasar» código defectuoso.

## Pendiente de completar por el equipo

- [ ] Reescribir esta bitácora con palabras propias y llenar «Qué entendí».
- [ ] Agregar la fecha real de cada sesión si no fue todo el mismo día.
- [ ] Ejecutar las diez pruebas de `PRUEBAS-CONTENCION.md` con capturas.
- [ ] Elegir y documentar al menos dos retos de excelencia de IA (numeral 10 de la hoja).
