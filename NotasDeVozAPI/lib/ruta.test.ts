import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "./errores";

const registrarErrorInterno = vi.hoisted(() => vi.fn());
vi.mock("./registro", () => ({ registrarErrorInterno }));

import { manejar, manejarConParams } from "./ruta";

beforeEach(() => {
  registrarErrorInterno.mockReset();
});

describe("registro de errores en las rutas", () => {
  it("registra un error interno y responde 500 sin detalles", async () => {
    const fallo = new Error("sin red");
    const ruta = manejar(() => Promise.reject(fallo));

    const respuesta = await ruta(peticion);

    expect(respuesta.status).toBe(500);
    expect(registrarErrorInterno).toHaveBeenCalledWith(fallo, peticion);
  });

  it("registra también los errores internos de las rutas con parámetros", async () => {
    const fallo = new Error("sin red");
    const ruta = manejarConParams<{ id: string }>(() => Promise.reject(fallo));

    await ruta(peticion, contexto);

    expect(registrarErrorInterno).toHaveBeenCalledWith(fallo, peticion);
  });

  it("no registra los errores previstos (ErrorApi)", async () => {
    const ruta = manejar(() => Promise.reject(new ErrorApi(401, "No autenticado")));

    expect((await ruta(peticion)).status).toBe(401);
    expect(registrarErrorInterno).not.toHaveBeenCalled();
  });
});

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
