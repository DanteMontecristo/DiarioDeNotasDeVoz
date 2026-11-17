import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const CARGAR = "require('firebase-admin/auth'); require('firebase-admin/firestore');";

function cargarConNode(opciones: string[]): string {
  return execFileSync(process.execPath, [...opciones, "-e", `${CARGAR} console.log("cargado")`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Las demás pruebas simulan Firebase, así que no cargan el paquete real.
 * Estas sí: en Vercel las rutas privadas respondían 500 porque firebase-admin dependía de
 * un módulo solo ESM (`jose` 6) que ese entorno no puede cargar con `require`.
 */
describe("firebase-admin real", () => {
  it("carga con la configuración normal de Node", () => {
    expect(cargarConNode([])).toContain("cargado");
  });

  it("carga también sin `require` de módulos ESM, como en el entorno de Vercel", () => {
    expect(cargarConNode(["--no-experimental-require-module"])).toContain("cargado");
  });

  it("package.json mantiene la versión de jose compatible con `require`", async () => {
    const paquete = await import("../package.json");

    expect(paquete.default.overrides.jose).toMatch(/^\^5\./);
  });
});
