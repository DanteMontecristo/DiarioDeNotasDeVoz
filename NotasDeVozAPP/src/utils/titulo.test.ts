import { LONGITUD_MAXIMA_TITULO, resolverTitulo, tituloPorDefecto } from "./titulo";

// 1 de noviembre de 2026, en la hora local del teléfono.
const FECHA = new Date(2026, 10, 1, 15, 4, 5);

describe("tituloPorDefecto", () => {
  it("usa la fecha local con día y mes de dos cifras", () => {
    expect(tituloPorDefecto(FECHA)).toBe("Nota del 01/11/2026");
  });
});

describe("resolverTitulo", () => {
  it("acepta un título normal", () => {
    expect(resolverTitulo("Idea para el proyecto", FECHA)).toEqual({
      ok: true,
      titulo: "Idea para el proyecto",
    });
  });

  it("quita los espacios de los extremos", () => {
    expect(resolverTitulo("  Idea  ", FECHA)).toEqual({ ok: true, titulo: "Idea" });
  });

  it.each(["", "   ", "\n\t"])("si queda vacío (%j) usa «Nota del <fecha>»", (entrada) => {
    expect(resolverTitulo(entrada, FECHA)).toEqual({ ok: true, titulo: "Nota del 01/11/2026" });
  });

  it("acepta exactamente 60 caracteres", () => {
    const justo = "a".repeat(LONGITUD_MAXIMA_TITULO);

    expect(LONGITUD_MAXIMA_TITULO).toBe(60);
    expect(resolverTitulo(justo, FECHA)).toEqual({ ok: true, titulo: justo });
  });

  it("rechaza más de 60 caracteres con un mensaje para el usuario", () => {
    expect(resolverTitulo("a".repeat(61), FECHA)).toEqual({
      ok: false,
      error: "El título puede tener máximo 60 caracteres.",
    });
  });

  it("mide la longitud después de quitar los espacios de los extremos", () => {
    const conEspacios = `  ${"a".repeat(60)}  `;

    expect(resolverTitulo(conEspacios, FECHA).ok).toBe(true);
  });
});
