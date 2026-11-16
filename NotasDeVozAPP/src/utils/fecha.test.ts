import { formatearFecha } from "./fecha";

describe("formatearFecha", () => {
  it("muestra día, mes, año, hora y minutos en la hora local del teléfono", () => {
    const iso = new Date(2026, 10, 1, 15, 4, 5).toISOString();

    expect(formatearFecha(iso)).toBe("01/11/2026 15:04");
  });

  it("rellena con ceros la hora y los minutos", () => {
    const iso = new Date(2026, 0, 9, 7, 5).toISOString();

    expect(formatearFecha(iso)).toBe("09/01/2026 07:05");
  });

  it.each(["", "ayer", "2026-13-45"])("con una fecha inválida (%j) no muestra nada", (texto) => {
    expect(formatearFecha(texto)).toBe("");
  });
});
