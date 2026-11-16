import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const renovar = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-rest", () => ({ renovar }));

import { POST } from "./route";

function peticion(datos: unknown): Request {
  return new Request("https://api.test/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    renovar.mockReset();
  });

  it("responde 200 con los tokens nuevos", async () => {
    const tokens = { token: "nuevo-id", refreshToken: "nuevo-refresh", expiraEnSeg: 3600 };
    renovar.mockResolvedValueOnce(tokens);

    const respuesta = await POST(peticion({ refreshToken: "refresh-falso" }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(tokens);
    expect(renovar).toHaveBeenCalledWith("refresh-falso");
  });

  it("responde 400 si falta el refreshToken", async () => {
    const respuesta = await POST(peticion({}));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo: "refreshToken" }] });
    expect(renovar).not.toHaveBeenCalled();
  });

  it("responde 401 si el refresh token ya no sirve", async () => {
    renovar.mockRejectedValueOnce(new ErrorApi(401, "Sesión inválida"));

    const respuesta = await POST(peticion({ refreshToken: "vencido" }));

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "Sesión inválida" });
  });
});
