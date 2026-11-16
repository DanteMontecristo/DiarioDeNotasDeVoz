import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ErrorApi } from "./errores";
import { leerJson, validar } from "./validacion";

const esquema = z.object({ titulo: z.string().min(1).max(60) });

function capturar(accion: () => unknown): unknown {
  try {
    accion();
  } catch (error) {
    return error;
  }
  return undefined;
}

function peticion(cuerpo: string): Request {
  return new Request("https://api.test/x", { method: "POST", body: cuerpo });
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
