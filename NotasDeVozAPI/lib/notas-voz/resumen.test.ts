import { describe, expect, it } from "vitest";
import { rangoSemana, resumirSemana, semanaActual } from "./resumen";

// Noviembre de 2026: el lunes 2 abre la semana que termina el domingo 8.
const BOGOTA = -300;

function nota(grabada_en: string, duracion_ms: number) {
  return { grabada_en, duracion_ms };
}

describe("rangoSemana", () => {
  it.each(["2026-11-02", "2026-11-04", "2026-11-08"])(
    "ubica %s en la semana del lunes 2 al domingo 8",
    (fecha) => {
      expect(rangoSemana(fecha, 0)).toEqual({
        inicio: "2026-11-02T00:00:00.000Z",
        fin: "2026-11-09T00:00:00.000Z",
        dias: [
          "2026-11-02",
          "2026-11-03",
          "2026-11-04",
          "2026-11-05",
          "2026-11-06",
          "2026-11-07",
          "2026-11-08",
        ],
      });
    },
  );

  it("desplaza los límites según el desfase horario del usuario", () => {
    expect(rangoSemana("2026-11-04", BOGOTA)).toMatchObject({
      inicio: "2026-11-02T05:00:00.000Z",
      fin: "2026-11-09T05:00:00.000Z",
    });
  });

  it("cruza bien un cambio de mes y de año", () => {
    expect(rangoSemana("2027-01-01", 0).dias).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });
});

describe("resumirSemana", () => {
  const rango = rangoSemana("2026-11-04", 0);

  it("devuelve siempre los 7 días, en cero si no hay notas", () => {
    const resumen = resumirSemana([], rango, 0);

    expect(resumen.dias).toHaveLength(7);
    expect(resumen.dias[0]).toEqual({ fecha: "2026-11-02", minutos: 0, notas: 0 });
    expect(resumen.total_minutos).toBe(0);
  });

  it("suma los minutos y cuenta las notas de cada día", () => {
    const notas = [
      nota("2026-11-02T08:00:00.000Z", 60000),
      nota("2026-11-02T20:00:00.000Z", 30000),
      nota("2026-11-05T10:00:00.000Z", 120000),
    ];

    const resumen = resumirSemana(notas, rango, 0);

    expect(resumen.dias[0]).toEqual({ fecha: "2026-11-02", minutos: 1.5, notas: 2 });
    expect(resumen.dias[3]).toEqual({ fecha: "2026-11-05", minutos: 2, notas: 1 });
    expect(resumen.total_minutos).toBe(3.5);
  });

  it("redondea los minutos a dos decimales", () => {
    const resumen = resumirSemana([nota("2026-11-02T08:00:00.000Z", 5000)], rango, 0);

    expect(resumen.dias[0]?.minutos).toBe(0.08);
  });

  it("asigna cada nota al día local del usuario, no al día UTC", () => {
    const rangoBogota = rangoSemana("2026-11-04", BOGOTA);
    // 02:00 UTC del martes 3 son las 21:00 del lunes 2 en Bogotá.
    const resumen = resumirSemana([nota("2026-11-03T02:00:00.000Z", 60000)], rangoBogota, BOGOTA);

    expect(resumen.dias[0]).toEqual({ fecha: "2026-11-02", minutos: 1, notas: 1 });
    expect(resumen.dias[1]?.notas).toBe(0);
  });

  it("ignora una nota cuyo día cae fuera de la semana", () => {
    const resumen = resumirSemana([nota("2026-11-20T08:00:00.000Z", 60000)], rango, 0);

    expect(resumen.total_minutos).toBe(0);
  });
});

describe("semanaActual", () => {
  it("devuelve la fecha local del usuario en ese instante", () => {
    const instante = Date.parse("2026-11-16T03:00:00.000Z");

    expect(semanaActual(instante, 0)).toBe("2026-11-16");
    expect(semanaActual(instante, BOGOTA)).toBe("2026-11-15");
  });
});
