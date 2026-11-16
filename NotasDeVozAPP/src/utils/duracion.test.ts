import {
  DURACION_MAXIMA_MS,
  DURACION_MINIMA_MS,
  esDuracionValida,
  formatearDuracion,
} from "./duracion";

describe("formatearDuracion", () => {
  it.each([
    [125000, "2:05"],
    [0, "0:00"],
    [999, "0:00"],
    [1000, "0:01"],
    [59999, "0:59"],
    [60000, "1:00"],
    [120000, "2:00"],
    [3725000, "62:05"],
  ])("convierte %d ms en «%s»", (ms, esperado) => {
    expect(formatearDuracion(ms)).toBe(esperado);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("trata %d como cero", (ms) => {
    expect(formatearDuracion(ms)).toBe("0:00");
  });
});

describe("esDuracionValida", () => {
  it("fija los límites en 1 s y 120 s", () => {
    expect(DURACION_MINIMA_MS).toBe(1000);
    expect(DURACION_MAXIMA_MS).toBe(120000);
  });

  it.each([1000, 5000, 120000])("acepta %d ms", (ms) => {
    expect(esDuracionValida(ms)).toBe(true);
  });

  it.each([
    ["un toque accidental de menos de 1 s", 999],
    ["más de 2 minutos", 120001],
    ["cero", 0],
    ["un valor negativo", -5000],
    ["un valor que no es número", Number.NaN],
  ])("rechaza %s", (_caso, ms) => {
    expect(esDuracionValida(ms)).toBe(false);
  });
});
