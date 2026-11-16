import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const exigirUsuario = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion", () => ({ exigirUsuario }));

import { GET } from "./route";

describe("GET /api/auth/yo", () => {
  beforeEach(() => {
    exigirUsuario.mockReset();
  });

  it("responde 200 con el usuario del token", async () => {
    exigirUsuario.mockResolvedValueOnce({ id: "uid-1", email: "ana@correo.test" });
    const peticion = new Request("https://api.test/api/auth/yo", {
      headers: { Authorization: "Bearer token-valido" },
    });

    const respuesta = await GET(peticion);

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      usuario: { id: "uid-1", email: "ana@correo.test" },
    });
    expect(exigirUsuario).toHaveBeenCalledWith(peticion);
  });

  it("responde 401 sin token", async () => {
    exigirUsuario.mockRejectedValueOnce(new ErrorApi(401, "No autenticado"));

    const respuesta = await GET(new Request("https://api.test/api/auth/yo"));

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autenticado" });
  });
});
