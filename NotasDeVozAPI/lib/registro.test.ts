import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ocultarSecretos, registrarErrorInterno } from "./registro";

const escribir = vi.spyOn(process.stderr, "write");

function ultimaEntrada(): Record<string, unknown> {
  const linea = String(escribir.mock.calls.at(-1)?.[0] ?? "{}");
  const entrada: Record<string, unknown> = JSON.parse(linea);
  return entrada;
}

const peticion = new Request("https://api.test/api/notas-voz/abc?since=2026&token=secreto", {
  method: "PUT",
});

beforeEach(() => {
  escribir.mockReset();
  escribir.mockReturnValue(true);
});

afterEach(() => {
  escribir.mockReset();
});

describe("ocultarSecretos", () => {
  it.each([
    ["un ID token", "token eyJhbGciOiJSUzI1NiJ9.eyJ1aWQiOiIxIn0.firma-123 vencido"],
    ["una cabecera Bearer", "cabecera Bearer abc.def-123 rechazada"],
    ["una clave de API de Google", "clave AIzaSyA1234567890abcdefghijklmnopqrstu inválida"],
    ["un correo", "el usuario ana.perez@correo.test no existe"],
    ["una clave privada", "-----BEGIN PRIVATE KEY-----\nMIIEvQ\n-----END PRIVATE KEY-----"],
  ])("oculta %s", (_caso, texto) => {
    const limpio = ocultarSecretos(texto);

    expect(limpio).toMatch(/\[(clave oculta|token oculto|correo oculto)\]/);
    expect(limpio).not.toMatch(/eyJ|abc\.def|AIzaSy|ana\.perez|MIIEvQ/);
  });

  it("deja intacto un mensaje sin datos sensibles", () => {
    expect(ocultarSecretos("API_KEY_INVALID")).toBe("API_KEY_INVALID");
  });
});

describe("registrarErrorInterno", () => {
  it("escribe una línea JSON con método, ruta, nombre, mensaje y código", () => {
    const error = Object.assign(new TypeError("sin red"), { code: "ECONNRESET" });

    registrarErrorInterno(error, peticion);

    expect(escribir).toHaveBeenCalledTimes(1);
    expect(String(escribir.mock.calls[0]?.[0])).toMatch(/\n$/);
    expect(ultimaEntrada()).toMatchObject({
      nivel: "error",
      metodo: "PUT",
      ruta: "/api/notas-voz/abc",
      nombre: "TypeError",
      mensaje: "sin red",
      codigo: "ECONNRESET",
    });
  });

  it("no registra los parámetros de la URL", () => {
    registrarErrorInterno(new Error("fallo"), peticion);

    expect(String(escribir.mock.calls[0]?.[0])).not.toContain("secreto");
  });

  it("oculta los datos sensibles del mensaje y de la pila", () => {
    registrarErrorInterno(new Error("falló para ana@correo.test"), peticion);

    const linea = String(escribir.mock.calls[0]?.[0]);
    expect(linea).not.toContain("ana@correo.test");
    expect(ultimaEntrada().mensaje).toBe("falló para [correo oculto]");
  });

  it("acepta valores que no son Error", () => {
    registrarErrorInterno("algo raro", peticion);

    expect(ultimaEntrada()).toMatchObject({
      nombre: "string",
      mensaje: "algo raro",
      codigo: null,
      pila: [],
    });
  });
});
