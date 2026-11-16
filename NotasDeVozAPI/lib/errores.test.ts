import { describe, expect, it } from "vitest";
import { ErrorApi, respuestaError } from "./errores";

describe("respuestaError", () => {
  it("convierte un ErrorApi en su código y mensaje", async () => {
    const respuesta = respuestaError(new ErrorApi(404, "No existe"));

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "No existe" });
  });

  it("incluye los detalles por campo cuando existen", async () => {
    const detalles = [{ campo: "titulo", mensaje: "Es obligatorio" }];
    const respuesta = respuestaError(new ErrorApi(400, "Datos inválidos", detalles));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({ error: "Datos inválidos", detalles });
  });

  it("oculta los errores internos: 500 sin detalles ni mensaje original", async () => {
    const respuesta = respuestaError(new Error("clave privada inválida en línea 3"));

    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: "Error interno" });
  });

  it("trata como interno cualquier valor que no sea un ErrorApi", async () => {
    const respuesta = respuestaError("algo raro");

    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: "Error interno" });
  });
});
