import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const mocks = vi.hoisted(() => ({ exigirUsuario: vi.fn(), guardar: vi.fn(), borrar: vi.fn() }));
vi.mock("@/lib/sesion", () => ({ exigirUsuario: mocks.exigirUsuario }));
vi.mock("@/lib/notas-voz/repositorio", () => ({ guardar: mocks.guardar, borrar: mocks.borrar }));

import { DELETE, PUT } from "./route";

const ID = "3f2b8c1e-5d4a-4b7c-9e1f-0a2b3c4d5e6f";
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const datos = {
  titulo: "Idea",
  duracion_ms: 5000,
  etiqueta: null,
  lat: null,
  lng: null,
  grabada_en: "2026-11-01T09:59:00.000Z",
};

function contexto(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function peticion(metodo: string, cuerpo?: unknown): Request {
  return new Request(`https://api.test/api/notas-voz/${ID}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.exigirUsuario.mockResolvedValue({ id: "uid-ana", email: "ana@correo.test" });
});

describe("PUT /api/notas-voz/:id", () => {
  it("guarda la nota del usuario del token y responde 200 con el documento", async () => {
    const guardada = { id: ID, ...datos, created_at: "x", updated_at: "x", deleted_at: null };
    mocks.guardar.mockResolvedValueOnce(guardada);

    const respuesta = await PUT(peticion("PUT", datos), contexto(ID));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(guardada);
    expect(mocks.guardar).toHaveBeenCalledWith("uid-ana", ID, datos, expect.stringMatching(ISO));
  });

  it("descarta uid, fechas y demás campos que el cliente no decide", async () => {
    const tramposo = { ...datos, uid: "uid-luis", updated_at: "2000-01-01T00:00:00.000Z" };

    await PUT(peticion("PUT", tramposo), contexto(ID));

    expect(mocks.guardar).toHaveBeenCalledWith("uid-ana", ID, datos, expect.any(String));
  });

  it("responde 400 con el campo inválido y no guarda nada", async () => {
    const respuesta = await PUT(peticion("PUT", { ...datos, duracion_ms: 500 }), contexto(ID));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo: "duracion_ms" }] });
    expect(mocks.guardar).not.toHaveBeenCalled();
  });

  it("responde 400 si el id no es un UUID", async () => {
    const respuesta = await PUT(peticion("PUT", datos), contexto("../otro-usuario"));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo: "id" }] });
    expect(mocks.guardar).not.toHaveBeenCalled();
  });

  it("responde 401 sin token, antes de validar nada", async () => {
    mocks.exigirUsuario.mockRejectedValueOnce(new ErrorApi(401, "No autenticado"));

    const respuesta = await PUT(peticion("PUT", { titulo: "" }), contexto(ID));

    expect(respuesta.status).toBe(401);
  });
});

describe("DELETE /api/notas-voz/:id", () => {
  it("hace el borrado lógico de la nota del usuario del token", async () => {
    mocks.borrar.mockResolvedValueOnce(true);

    const respuesta = await DELETE(peticion("DELETE"), contexto(ID));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ ok: true });
    expect(mocks.borrar).toHaveBeenCalledWith("uid-ana", ID, expect.stringMatching(ISO));
  });

  it("responde 404 si la nota no existe para ese usuario", async () => {
    mocks.borrar.mockResolvedValueOnce(false);

    const respuesta = await DELETE(peticion("DELETE"), contexto(ID));

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "La nota no existe" });
  });

  it("responde 400 si el id no es un UUID", async () => {
    const respuesta = await DELETE(peticion("DELETE"), contexto("abc"));

    expect(respuesta.status).toBe(400);
    expect(mocks.borrar).not.toHaveBeenCalled();
  });

  it("responde 401 sin token", async () => {
    mocks.exigirUsuario.mockRejectedValueOnce(new ErrorApi(401, "No autenticado"));

    const respuesta = await DELETE(peticion("DELETE"), contexto(ID));

    expect(respuesta.status).toBe(401);
    expect(mocks.borrar).not.toHaveBeenCalled();
  });
});
