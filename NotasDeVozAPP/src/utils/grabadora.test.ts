import { debeCancelar, nivelDesdeMedidor, UMBRAL_CANCELAR_PX } from "./grabadora";

describe("nivelDesdeMedidor", () => {
  it.each([
    [0, 1],
    [-30, 0.5],
    [-60, 0],
    [-15, 0.75],
  ])("convierte %d dB en un nivel de %d", (decibeles, nivel) => {
    expect(nivelDesdeMedidor(decibeles)).toBeCloseTo(nivel);
  });

  it.each([
    ["por debajo del mínimo", -160, 0],
    ["por encima del máximo", 12, 1],
  ])("recorta un valor %s", (_caso, decibeles, nivel) => {
    expect(nivelDesdeMedidor(decibeles)).toBe(nivel);
  });

  it.each([undefined, Number.NaN])("sin medición (%p) el nivel es cero", (decibeles) => {
    expect(nivelDesdeMedidor(decibeles)).toBe(0);
  });
});

describe("debeCancelar", () => {
  it("cancela al deslizar a la izquierda hasta el umbral o más", () => {
    expect(debeCancelar(-UMBRAL_CANCELAR_PX)).toBe(true);
    expect(debeCancelar(-UMBRAL_CANCELAR_PX - 50)).toBe(true);
  });

  it("no cancela con un movimiento corto del dedo", () => {
    expect(debeCancelar(-UMBRAL_CANCELAR_PX + 1)).toBe(false);
    expect(debeCancelar(0)).toBe(false);
  });

  it("no cancela al deslizar a la derecha", () => {
    expect(debeCancelar(300)).toBe(false);
  });
});
