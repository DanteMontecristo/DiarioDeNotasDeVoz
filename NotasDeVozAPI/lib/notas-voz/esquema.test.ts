import { describe, expect, it } from "vitest";
import { esquemaDatosNota } from "./esquema";

const valida = {
  titulo: "Idea para el proyecto",
  duracion_ms: 5000,
  etiqueta: "clase",
  lat: 6.2442,
  lng: -75.5812,
  grabada_en: "2026-11-01T15:04:05.000Z",
};

function campoQueFalla(datos: unknown): string | undefined {
  const resultado = esquemaDatosNota.safeParse(datos);
  return resultado.success ? undefined : resultado.error.issues[0]?.path.join(".");
}

describe("esquemaDatosNota: datos aceptados", () => {
  it("acepta una nota completa", () => {
    expect(esquemaDatosNota.parse(valida)).toEqual(valida);
  });

  it("acepta etiqueta y lugar en null", () => {
    const sinExtras = { ...valida, etiqueta: null, lat: null, lng: null };

    expect(esquemaDatosNota.parse(sinExtras)).toEqual(sinExtras);
  });

  it("descarta los campos no declarados", () => {
    const conExtras = { ...valida, uid: "otro", updated_at: "2000-01-01T00:00:00.000Z" };

    expect(esquemaDatosNota.parse(conExtras)).toEqual(valida);
  });

  it("normaliza grabada_en a ISO UTC con milisegundos", () => {
    const sinMilisegundos = { ...valida, grabada_en: "2026-11-01T15:04:05Z" };

    expect(esquemaDatosNota.parse(sinMilisegundos).grabada_en).toBe("2026-11-01T15:04:05.000Z");
  });

  it("acepta los límites de duración: 1 s y 120 s", () => {
    expect(campoQueFalla({ ...valida, duracion_ms: 1000 })).toBeUndefined();
    expect(campoQueFalla({ ...valida, duracion_ms: 120000 })).toBeUndefined();
  });
});

describe("esquemaDatosNota: datos rechazados", () => {
  it.each([
    ["título vacío", { titulo: "   " }, "titulo"],
    ["título de más de 60 caracteres", { titulo: "a".repeat(61) }, "titulo"],
    ["duración menor de 1 s", { duracion_ms: 999 }, "duracion_ms"],
    ["duración mayor de 120 s", { duracion_ms: 120001 }, "duracion_ms"],
    ["duración con decimales", { duracion_ms: 1500.5 }, "duracion_ms"],
    ["latitud fuera de rango", { lat: 91 }, "lat"],
    ["longitud fuera de rango", { lng: -181 }, "lng"],
    ["fecha que no es ISO 8601", { grabada_en: "ayer" }, "grabada_en"],
    ["latitud sin longitud", { lng: null }, "lng"],
  ])("rechaza %s", (_caso, cambio, campo) => {
    expect(campoQueFalla({ ...valida, ...cambio })).toBe(campo);
  });

  it("rechaza una nota sin etiqueta declarada (debe venir null, no faltar)", () => {
    const sinEtiqueta = { ...valida, etiqueta: undefined };

    expect(campoQueFalla(sinEtiqueta)).toBe("etiqueta");
  });
});
