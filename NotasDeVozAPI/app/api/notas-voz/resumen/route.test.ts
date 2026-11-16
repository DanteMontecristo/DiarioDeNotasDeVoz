import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/errores";

const mocks = vi.hoisted(() => ({ exigirUsuario: vi.fn(), listarGrabadasEntre: vi.fn() }));
vi.mock("@/lib/sesion", () => ({ exigirUsuario: mocks.exigirUsuario }));
vi.mock("@/lib/notas-voz/repositorio", () => ({
  listarGrabadasEntre: mocks.listarGrabadasEntre,
}));

import { GET } from "./route";

function peticion(consulta = ""): Request {
  return new Request(`https://api.test/api/notas-voz/resumen${consulta}`);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-16T03:00:00.000Z"));
  mocks.exigirUsuario.mockResolvedValue({ id: "uid-ana", email: "ana@correo.test" });
  mocks.listarGrabadasEntre.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/notas-voz/resumen: respuesta", () => {
  it("devuelve los minutos por día de la semana pedida", async () => {
    mocks.listarGrabadasEntre.mockResolvedValueOnce([
      { grabada_en: "2026-11-02T08:00:00.000Z", duracion_ms: 90000 },
    ]);

    const respuesta = await GET(peticion("?semana=2026-11-04"));
    const cuerpo: unknown = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toMatchObject({
      semana: { inicio: "2026-11-02", fin: "2026-11-08" },
      total_minutos: 1.5,
    });
    expect(cuerpo).toHaveProperty("dias.0", { fecha: "2026-11-02", minutos: 1.5, notas: 1 });
    expect(cuerpo).toHaveProperty("dias.6.fecha", "2026-11-08");
    expect(mocks.listarGrabadasEntre).toHaveBeenCalledWith(
      "uid-ana",
      "2026-11-02T00:00:00.000Z",
      "2026-11-09T00:00:00.000Z",
    );
  });

  it("sin semana usa la semana actual", async () => {
    const respuesta = await GET(peticion());

    expect(await respuesta.json()).toMatchObject({
      semana: { inicio: "2026-11-16", fin: "2026-11-22" },
    });
  });

  it("con desfase_min calcula la semana y los días en la hora local del usuario", async () => {
    // A las 03:00 UTC del lunes 16 todavía es domingo 15 en Bogotá (UTC-5).
    const respuesta = await GET(peticion("?desfase_min=-300"));

    expect(await respuesta.json()).toMatchObject({
      semana: { inicio: "2026-11-09", fin: "2026-11-15" },
    });
    expect(mocks.listarGrabadasEntre).toHaveBeenCalledWith(
      "uid-ana",
      "2026-11-09T05:00:00.000Z",
      "2026-11-16T05:00:00.000Z",
    );
  });
});

describe("GET /api/notas-voz/resumen: rechazos", () => {
  it("responde 401 sin token", async () => {
    mocks.exigirUsuario.mockRejectedValueOnce(new ErrorApi(401, "No autenticado"));

    const respuesta = await GET(peticion());

    expect(respuesta.status).toBe(401);
    expect(mocks.listarGrabadasEntre).not.toHaveBeenCalled();
  });

  it.each([
    ["semana que no es una fecha", "?semana=la-pasada", "semana"],
    ["semana con una fecha imposible", "?semana=2026-02-30", "semana"],
    ["desfase que no es un número", "?desfase_min=abc", "desfase_min"],
    ["desfase fuera de rango", "?desfase_min=2000", "desfase_min"],
  ])("responde 400 con %s", async (_caso, consulta, campo) => {
    const respuesta = await GET(peticion(consulta));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({ detalles: [{ campo }] });
    expect(mocks.listarGrabadasEntre).not.toHaveBeenCalled();
  });
});
