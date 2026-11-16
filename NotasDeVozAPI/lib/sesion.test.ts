import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "./errores";

const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock("./firebase", () => ({ obtenerAuth: () => ({ verifyIdToken }) }));

import { exigirUsuario } from "./sesion";

function peticion(cabeceras: Record<string, string> = {}, url = "https://api.test/api/x"): Request {
  return new Request(url, { headers: cabeceras });
}

async function capturar(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  return undefined;
}

function errorFirebase(codigo: string): Error {
  return Object.assign(new Error("fallo de firebase"), { code: codigo });
}

describe("exigirUsuario", () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it("devuelve el usuario del token verificado", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "uid-1", email: "ana@correo.test" });

    const usuario = await exigirUsuario(peticion({ Authorization: "Bearer token-valido" }));

    expect(usuario).toEqual({ id: "uid-1", email: "ana@correo.test" });
    expect(verifyIdToken).toHaveBeenCalledWith("token-valido");
  });

  it("usa null cuando el token no trae correo", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "uid-2" });

    const usuario = await exigirUsuario(peticion({ Authorization: "Bearer token-valido" }));

    expect(usuario).toEqual({ id: "uid-2", email: null });
  });

  it("toma el uid solo del token, nunca de la URL", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "uid-real", email: "ana@correo.test" });
    const conUidAjeno = peticion(
      { Authorization: "Bearer token-valido" },
      "https://api.test/api/x?uid=uid-de-otro",
    );

    expect((await exigirUsuario(conUidAjeno)).id).toBe("uid-real");
  });

  it.each([
    ["sin cabecera Authorization", {}],
    ["con un esquema distinto de Bearer", { Authorization: "Basic abc123" }],
    ["con Bearer pero sin token", { Authorization: "Bearer " }],
  ])("responde 401 %s, sin consultar a Firebase", async (_caso, cabeceras) => {
    const error = await capturar(exigirUsuario(peticion(cabeceras)));

    expect(error).toMatchObject({ status: 401, message: "No autenticado" });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it.each(["auth/id-token-expired", "auth/argument-error", "auth/id-token-revoked"])(
    "responde 401 si Firebase rechaza el token (%s)",
    async (codigo) => {
      verifyIdToken.mockRejectedValueOnce(errorFirebase(codigo));

      const error = await capturar(exigirUsuario(peticion({ Authorization: "Bearer malo" })));

      expect(error).toMatchObject({ status: 401, message: "Sesión inválida o vencida" });
    },
  );

  it("trata como error interno un fallo que no es del token", async () => {
    verifyIdToken.mockRejectedValueOnce(new Error("sin red para descargar certificados"));

    const error = await capturar(exigirUsuario(peticion({ Authorization: "Bearer token" })));

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ErrorApi);
  });
});
