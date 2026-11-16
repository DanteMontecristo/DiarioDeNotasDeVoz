import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const registrar = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-rest", () => ({ registrar }));

import { POST } from "./route";

const sesion = {
  token: "id-token-falso",
  refreshToken: "refresh-falso",
  expiraEnSeg: 3600,
  usuario: { id: "uid-1", email: "ana@correo.test" },
};

function peticion(cuerpo: string): Request {
  return new Request("https://api.test/api/auth/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
  });
}

describe("POST /api/auth/registro", () => {
  beforeEach(() => {
    registrar.mockReset();
  });

  it("crea la cuenta y responde 201 con la sesión", async () => {
    registrar.mockResolvedValueOnce(sesion);
    const cuerpo = JSON.stringify({ email: "ana@correo.test", password: "secreta-123" });

    const respuesta = await POST(peticion(cuerpo));

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual(sesion);
    expect(registrar).toHaveBeenCalledWith("ana@correo.test", "secreta-123");
  });

  it("responde 400 si el correo no es válido, sin llamar a Firebase", async () => {
    const cuerpo = JSON.stringify({ email: "no-es-correo", password: "secreta-123" });

    const respuesta = await POST(peticion(cuerpo));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      error: "Datos inválidos",
      detalles: [{ campo: "email" }],
    });
    expect(registrar).not.toHaveBeenCalled();
  });

  it("responde 400 si la contraseña tiene menos de 8 caracteres", async () => {
    const cuerpo = JSON.stringify({ email: "ana@correo.test", password: "1234567" });

    const respuesta = await POST(peticion(cuerpo));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo: "password" }] });
  });

  it("responde 400 si el cuerpo no es JSON", async () => {
    const respuesta = await POST(peticion("esto no es json"));

    expect(respuesta.status).toBe(400);
  });

  it("responde 409 si el correo ya está registrado", async () => {
    registrar.mockRejectedValueOnce(new ErrorApi(409, "El correo ya está registrado"));
    const cuerpo = JSON.stringify({ email: "ana@correo.test", password: "secreta-123" });

    const respuesta = await POST(peticion(cuerpo));

    expect(respuesta.status).toBe(409);
    expect(await respuesta.json()).toEqual({ error: "El correo ya está registrado" });
  });

  it("responde 500 sin detalles ante un fallo interno", async () => {
    registrar.mockRejectedValueOnce(new Error("API_KEY_INVALID"));
    const cuerpo = JSON.stringify({ email: "ana@correo.test", password: "secreta-123" });

    const respuesta = await POST(peticion(cuerpo));

    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: "Error interno" });
  });
});
