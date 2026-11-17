import { resolverUrlApi } from "./config";

describe("resolverUrlApi", () => {
  it("acepta una URL https y le quita la barra final", () => {
    expect(resolverUrlApi("https://mi-api.vercel.app/")).toBe("https://mi-api.vercel.app");
    expect(resolverUrlApi("  https://mi-api.vercel.app  ")).toBe("https://mi-api.vercel.app");
  });

  it.each([undefined, "", "   "])("si falta (%p) explica cómo configurarla", (valor) => {
    expect(() => resolverUrlApi(valor)).toThrow("EXPO_PUBLIC_API_URL");
  });

  it.each(["http://mi-api.vercel.app", "http://localhost:3000", "mi-api.vercel.app"])(
    "rechaza %s porque no es https",
    (valor) => {
      expect(() => resolverUrlApi(valor)).toThrow("https");
    },
  );
});
