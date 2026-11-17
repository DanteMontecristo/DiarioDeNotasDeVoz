import { describe, expect, it } from "vitest";

/**
 * Las demás pruebas simulan Firebase, así que no cargan el paquete real.
 * Esta sí lo carga: firebase-admin depende de un módulo que solo funciona con Node 22
 * o superior, y con una versión anterior la API falla en producción con un error 500.
 */
describe("firebase-admin real", () => {
  it("carga el módulo de autenticación en esta versión de Node", async () => {
    const auth = await import("firebase-admin/auth");

    expect(typeof auth.getAuth).toBe("function");
  });

  it("carga el módulo de Firestore en esta versión de Node", async () => {
    const firestore = await import("firebase-admin/firestore");

    expect(typeof firestore.getFirestore).toBe("function");
  });

  it("package.json fija Node 22 para el despliegue", async () => {
    const paquete = await import("../package.json");

    expect(paquete.default.engines.node).toBe("22.x");
  });
});
