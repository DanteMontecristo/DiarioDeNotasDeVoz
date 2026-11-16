import {
  direccionDelToque,
  etiquetaVelocidad,
  posicionConSalto,
  posicionDesdeBarra,
  SALTO_MS,
  siguienteVelocidad,
  VELOCIDADES,
} from "./reproductor";

describe("velocidades", () => {
  it("ofrece 1×, 1,5× y 2×", () => {
    expect(VELOCIDADES).toEqual([1, 1.5, 2]);
  });

  it.each([
    [1, 1.5],
    [1.5, 2],
    [2, 1],
  ])("después de %d sigue %d", (actual, siguiente) => {
    expect(siguienteVelocidad(actual)).toBe(siguiente);
  });

  it("con una velocidad desconocida vuelve a la normal", () => {
    expect(siguienteVelocidad(3)).toBe(1);
  });

  it.each([
    [1, "1×"],
    [1.5, "1,5×"],
    [2, "2×"],
  ])("escribe %d como «%s», con coma decimal", (velocidad, texto) => {
    expect(etiquetaVelocidad(velocidad)).toBe(texto);
  });
});

describe("posicionConSalto", () => {
  it("salta 10 segundos", () => {
    expect(SALTO_MS).toBe(10000);
  });

  it("avanza y retrocede dentro de la nota", () => {
    expect(posicionConSalto(30000, 120000, "adelante")).toBe(40000);
    expect(posicionConSalto(30000, 120000, "atras")).toBe(20000);
  });

  it("no pasa del final ni baja de cero", () => {
    expect(posicionConSalto(115000, 120000, "adelante")).toBe(120000);
    expect(posicionConSalto(4000, 120000, "atras")).toBe(0);
  });
});

describe("posicionDesdeBarra", () => {
  it("convierte el punto tocado de la barra en una posición de la nota", () => {
    expect(posicionDesdeBarra(150, 300, 120000)).toBe(60000);
    expect(posicionDesdeBarra(0, 300, 120000)).toBe(0);
    expect(posicionDesdeBarra(300, 300, 120000)).toBe(120000);
  });

  it("recorta si el dedo se sale de la barra", () => {
    expect(posicionDesdeBarra(-40, 300, 120000)).toBe(0);
    expect(posicionDesdeBarra(900, 300, 120000)).toBe(120000);
  });

  it("si la barra aún no tiene ancho, la posición es cero", () => {
    expect(posicionDesdeBarra(50, 0, 120000)).toBe(0);
  });
});

describe("direccionDelToque", () => {
  it("la mitad izquierda retrocede y la derecha avanza", () => {
    expect(direccionDelToque(10, 300)).toBe("atras");
    expect(direccionDelToque(149, 300)).toBe("atras");
    expect(direccionDelToque(150, 300)).toBe("adelante");
    expect(direccionDelToque(290, 300)).toBe("adelante");
  });
});
