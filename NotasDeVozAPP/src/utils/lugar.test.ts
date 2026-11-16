import { formatearCoordenadas, nombreDelLugar } from "./lugar";

const vacia = { city: null, district: null, subregion: null, region: null, country: null };

describe("nombreDelLugar", () => {
  it("prefiere la ciudad", () => {
    expect(nombreDelLugar({ ...vacia, city: "Medellín", region: "Antioquia" })).toBe("Medellín");
  });

  it("si no hay ciudad usa lo más cercano que exista", () => {
    expect(nombreDelLugar({ ...vacia, subregion: "Valle de Aburrá", region: "Antioquia" })).toBe(
      "Valle de Aburrá",
    );
    expect(nombreDelLugar({ ...vacia, region: "Antioquia", country: "Colombia" })).toBe(
      "Antioquia",
    );
    expect(nombreDelLugar({ ...vacia, country: "Colombia" })).toBe("Colombia");
  });

  it("ignora los textos vacíos", () => {
    expect(nombreDelLugar({ ...vacia, city: "  ", region: "Antioquia" })).toBe("Antioquia");
  });

  it("devuelve null si la dirección no trae nada, o no hay dirección", () => {
    expect(nombreDelLugar(vacia)).toBeNull();
    expect(nombreDelLugar(undefined)).toBeNull();
  });
});

describe("formatearCoordenadas", () => {
  it("muestra latitud y longitud con cuatro decimales", () => {
    expect(formatearCoordenadas(6.244203, -75.581212)).toBe("6.2442, -75.5812");
  });
});
