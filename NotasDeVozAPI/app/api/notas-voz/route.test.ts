import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const mocks = vi.hoisted(() => ({ exigirUsuario: vi.fn(), listarDesde: vi.fn() }));
vi.mock("@/lib/sesion", () => ({ exigirUsuario: mocks.exigirUsuario }));
vi.mock("@/lib/notas-voz/repositorio", () => ({ listarDesde: mocks.listarDesde }));

import { GET } from "./route";

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function peticion(consulta = ""): Request {
  return new Request(`https://api.test/api/notas-voz${consulta}`);
}

describe("GET /api/notas-voz", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.exigirUsuario.mockResolvedValue({ id: "uid-ana", email: "ana@correo.test" });
    mocks.listarDesde.mockResolvedValue([]);
  });

  it("responde 401 sin token y no consulta las notas", async () => {
    mocks.exigirUsuario.mockRejectedValueOnce(new ErrorApi(401, "No autenticado"));

    const respuesta = await GET(peticion());

    expect(respuesta.status).toBe(401);
    expect(mocks.listarDesde).not.toHaveBeenCalled();
  });

  it("sin since pide todas las notas del usuario del token", async () => {
    const items = [{ id: "nota-1", titulo: "Idea" }];
    mocks.listarDesde.mockResolvedValueOnce(items);

    const respuesta = await GET(peticion());

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ items, servidor_ahora: expect.stringMatching(ISO) });
    expect(mocks.listarDesde).toHaveBeenCalledWith("uid-ana", null);
  });

  it("con since pide solo lo posterior, con la fecha normalizada a UTC", async () => {
    await GET(peticion("?since=2026-11-01T10:00:00Z"));

    expect(mocks.listarDesde).toHaveBeenCalledWith("uid-ana", "2026-11-01T10:00:00.000Z");
  });

  it("ignora un uid enviado en la URL", async () => {
    await GET(peticion("?uid=uid-luis"));

    expect(mocks.listarDesde).toHaveBeenCalledWith("uid-ana", null);
  });

  it("responde 400 si since no es una fecha ISO 8601", async () => {
    const respuesta = await GET(peticion("?since=ayer"));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo: "since" }] });
    expect(mocks.listarDesde).not.toHaveBeenCalled();
  });
});
