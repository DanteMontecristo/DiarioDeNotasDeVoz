import { LONGITUD_MAXIMA_ETIQUETA, resolverEtiqueta } from "./etiqueta";

describe("resolverEtiqueta", () => {
  it("acepta una etiqueta y le quita los espacios de los extremos", () => {
    expect(resolverEtiqueta("  clase ")).toEqual({ ok: true, etiqueta: "clase" });
  });

  it.each([null, "", "   "])("sin etiqueta (%j) guarda null", (entrada) => {
    expect(resolverEtiqueta(entrada)).toEqual({ ok: true, etiqueta: null });
  });

  it("acepta exactamente 30 caracteres, el mismo límite de la API", () => {
    expect(LONGITUD_MAXIMA_ETIQUETA).toBe(30);
    expect(resolverEtiqueta("a".repeat(30)).ok).toBe(true);
  });

  it("rechaza más de 30 caracteres con un mensaje para el usuario", () => {
    expect(resolverEtiqueta("a".repeat(31))).toEqual({
      ok: false,
      error: "La etiqueta puede tener máximo 30 caracteres.",
    });
  });
});
