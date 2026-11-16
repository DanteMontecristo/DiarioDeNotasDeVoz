import { describe, expect, it } from "vitest";
import { ErrorApi } from "./errores";
import { manejarConParams } from "./ruta";

const peticion = new Request("https://api.test/api/x/7");
const contexto = { params: Promise.resolve({ id: "7" }) };

describe("manejarConParams", () => {
  it("entrega al manejador los parámetros de la ruta ya resueltos", async () => {
    const ruta = manejarConParams<{ id: string }>((_peticion, params) =>
      Promise.resolve(Response.json({ id: params.id })),
    );

    expect(await (await ruta(peticion, contexto)).json()).toEqual({ id: "7" });
  });

  it("convierte los errores al formato único", async () => {
    const ruta = manejarConParams<{ id: string }>(() =>
      Promise.reject(new ErrorApi(404, "No existe")),
    );

    const respuesta = await ruta(peticion, contexto);

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "No existe" });
  });
});
