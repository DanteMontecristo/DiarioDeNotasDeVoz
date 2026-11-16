import { estaBocaAbajo } from "./orientacion";

describe("estaBocaAbajo en Android", () => {
  it("lo detecta cuando la pantalla mira hacia el suelo (z cerca de -1)", () => {
    expect(estaBocaAbajo(-0.98, "android")).toBe(true);
    expect(estaBocaAbajo(-0.85, "android")).toBe(true);
  });

  it.each([
    ["boca arriba sobre la mesa", 0.98],
    ["de pie en la mano", 0.05],
    ["inclinado hacia abajo, pero sin llegar a estar plano", -0.6],
  ])("no lo confunde con estar %s", (_caso, z) => {
    expect(estaBocaAbajo(z, "android")).toBe(false);
  });
});

describe("estaBocaAbajo en iOS", () => {
  it("usa el signo contrario: boca abajo es z cerca de +1", () => {
    expect(estaBocaAbajo(0.98, "ios")).toBe(true);
    expect(estaBocaAbajo(-0.98, "ios")).toBe(false);
  });
});

describe("estaBocaAbajo en otras plataformas", () => {
  it("nunca lo afirma si no conoce la convención del sensor", () => {
    expect(estaBocaAbajo(-0.98, "web")).toBe(false);
    expect(estaBocaAbajo(0.98, "web")).toBe(false);
  });
});
