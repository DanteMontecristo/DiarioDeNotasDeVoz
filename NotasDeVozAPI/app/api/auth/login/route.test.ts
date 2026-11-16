import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const iniciarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-rest", () => ({ iniciarSesion }));

import { POST } from "./route";

const sesion = {
  token: "id-token-falso",
  refreshToken: "refresh-falso",
  expiraEnSeg: 3600,
  usuario: { id: "uid-1", email: "ana@correo.test" },
};

function peticion(datos: unknown): Request {
  return new Request("https://api.test/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    iniciarSesion.mockReset();
  });

  it("responde 200 con la sesión", async () => {
    iniciarSesion.mockResolvedValueOnce(sesion);

    const respuesta = await POST(peticion({ email: "ana@correo.test", password: "secreta-123" }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual(sesion);
    expect(iniciarSesion).toHaveBeenCalledWith("ana@correo.test", "secreta-123");
  });

  it("responde 401 con el mensaje único de credenciales inválidas", async () => {
    iniciarSesion.mockRejectedValueOnce(new ErrorApi(401, "Credenciales inválidas"));

    const respuesta = await POST(peticion({ email: "ana@correo.test", password: "incorrecta" }));

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "Credenciales inválidas" });
  });

  it("responde 400 si falta la contraseña, sin llamar a Firebase", async () => {
    const respuesta = await POST(peticion({ email: "ana@correo.test" }));

    expect(respuesta.status).toBe(400);
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("responde 429 ante demasiados intentos", async () => {
    iniciarSesion.mockRejectedValueOnce(new ErrorApi(429, "Demasiados intentos"));

    const respuesta = await POST(peticion({ email: "ana@correo.test", password: "incorrecta" }));

    expect(respuesta.status).toBe(429);
  });
});
