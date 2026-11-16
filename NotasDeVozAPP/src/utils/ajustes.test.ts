import {
  AJUSTES_POR_DEFECTO,
  etiquetaLimite,
  interpretarAjustes,
  LIMITES_MS,
  serializarAjustes,
} from "./ajustes";

describe("ajustes por defecto", () => {
  it("graban en calidad alta, con el máximo de 2 minutos y sin guardar el lugar", () => {
    expect(AJUSTES_POR_DEFECTO).toEqual({ calidad: "alta", limiteMs: 120000, guardarLugar: false });
  });

  it("ningún límite ofrecido supera los 2 minutos", () => {
    expect(LIMITES_MS).toEqual([30000, 60000, 120000]);
  });
});

describe("interpretarAjustes", () => {
  it("sin nada guardado devuelve los valores por defecto", () => {
    expect(interpretarAjustes({})).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("lee los valores guardados", () => {
    const guardados = { calidad: "baja", limite_ms: "30000", guardar_lugar: "1" };

    expect(interpretarAjustes(guardados)).toEqual({
      calidad: "baja",
      limiteMs: 30000,
      guardarLugar: true,
    });
  });

  it.each([
    ["una calidad desconocida", { calidad: "ultra" }, "calidad", "alta"],
    ["un límite que no se ofrece", { limite_ms: "45000" }, "limiteMs", 120000],
    ["un límite mayor de 2 minutos", { limite_ms: "600000" }, "limiteMs", 120000],
    ["un límite que no es número", { limite_ms: "mucho" }, "limiteMs", 120000],
    ["un valor raro para el lugar", { guardar_lugar: "quizá" }, "guardarLugar", false],
  ])("ante %s usa el valor por defecto", (_caso, guardados, campo, esperado) => {
    expect(interpretarAjustes(guardados)).toHaveProperty(campo, esperado);
  });
});

describe("serializarAjustes", () => {
  it("convierte solo los ajustes que cambian en pares clave-valor de texto", () => {
    expect(serializarAjustes({ limiteMs: 60000 })).toEqual({ limite_ms: "60000" });
    expect(serializarAjustes({ calidad: "baja", guardarLugar: true })).toEqual({
      calidad: "baja",
      guardar_lugar: "1",
    });
    expect(serializarAjustes({ guardarLugar: false })).toEqual({ guardar_lugar: "0" });
  });

  it("lo serializado se vuelve a interpretar igual", () => {
    const ajustes = { calidad: "baja", limiteMs: 30000, guardarLugar: true } as const;

    expect(interpretarAjustes(serializarAjustes(ajustes))).toEqual(ajustes);
  });
});

describe("etiquetaLimite", () => {
  it.each([
    [30000, "30 segundos"],
    [60000, "1 minuto"],
    [120000, "2 minutos"],
  ])("describe %d ms como «%s»", (ms, texto) => {
    expect(etiquetaLimite(ms)).toBe(texto);
  });
});
