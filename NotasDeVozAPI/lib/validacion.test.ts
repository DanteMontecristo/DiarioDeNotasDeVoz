import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ErrorApi } from "./errores";
import { leerJson, LIMITE_CUERPO_BYTES, validar } from "./validacion";

const esquema = z.object({ titulo: z.string().min(1).max(60) });

function capturar(accion: () => unknown): unknown {
  try {
    accion();
  } catch (error) {
    return error;
  }
  return undefined;
}

const JSON_TIPO = { "Content-Type": "application/json" };

function peticion(cuerpo: string, cabeceras: Record<string, string> = JSON_TIPO): Request {
  return new Request("https://api.test/x", { method: "POST", body: cuerpo, headers: cabeceras });
}

describe("validar", () => {
  it("devuelve solo los campos declarados en el esquema", () => {
    const datos = validar(esquema, { titulo: "Idea", uid: "otro-usuario", rol: "admin" });

    expect(datos).toEqual({ titulo: "Idea" });
  });

  it("lanza un ErrorApi 400 con el campo que falló", () => {
    const error = capturar(() => validar(esquema, { titulo: "" }));

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({
      status: 400,
      message: "Datos inválidos",
      detalles: [{ campo: "titulo", mensaje: expect.any(String) }],
    });
  });

  it("lanza un ErrorApi 400 cuando el cuerpo no es un objeto", () => {
    const error = capturar(() => validar(esquema, null));

    expect(error).toMatchObject({ status: 400 });
  });
});

describe("leerJson", () => {
  it("devuelve el cuerpo interpretado", async () => {
    expect(await leerJson(peticion('{"titulo":"Idea"}'))).toEqual({ titulo: "Idea" });
  });

  it("lanza un ErrorApi 400 si el cuerpo no es JSON válido", async () => {
    await expect(leerJson(peticion("{titulo:"))).rejects.toMatchObject({
      status: 400,
      message: "El cuerpo debe ser JSON válido",
    });
  });
});

describe("leerJson: tipo de contenido (415)", () => {
  it("acepta application/json con charset", async () => {
    const conCharset = peticion('{"a":1}', { "Content-Type": "application/json; charset=utf-8" });

    expect(await leerJson(conCharset)).toEqual({ a: 1 });
  });

  it.each([
    ["texto plano", { "Content-Type": "text/plain" }],
    ["un formulario", { "Content-Type": "application/x-www-form-urlencoded" }],
    ["un tipo que solo se parece a JSON", { "Content-Type": "application/jsonp" }],
  ])("responde 415 si el cuerpo llega como %s", async (_caso, cabeceras) => {
    await expect(leerJson(peticion('{"a":1}', cabeceras))).rejects.toMatchObject({
      status: 415,
      message: "El cuerpo debe enviarse como application/json",
    });
  });
});

describe("leerJson: tamaño del cuerpo (413)", () => {
  const enorme = JSON.stringify({ relleno: "x".repeat(LIMITE_CUERPO_BYTES) });

  it("responde 413 si Content-Length declara más del límite", async () => {
    const cabeceras = { ...JSON_TIPO, "Content-Length": String(LIMITE_CUERPO_BYTES + 1) };

    await expect(leerJson(peticion("{}", cabeceras))).rejects.toMatchObject({
      status: 413,
      message: "El cuerpo es demasiado grande",
    });
  });

  it("responde 413 si el cuerpo real supera el límite aunque no lo declare", async () => {
    await expect(leerJson(peticion(enorme))).rejects.toMatchObject({ status: 413 });
  });

  it("mide el tamaño en bytes, no en caracteres", async () => {
    const tildes = JSON.stringify({ relleno: "ñ".repeat(LIMITE_CUERPO_BYTES / 2) });

    await expect(leerJson(peticion(tildes))).rejects.toMatchObject({ status: 413 });
  });

  it("acepta un cuerpo dentro del límite", async () => {
    const normal = JSON.stringify({ relleno: "x".repeat(1000) });

    expect(await leerJson(peticion(normal))).toMatchObject({ relleno: expect.any(String) });
  });
});
