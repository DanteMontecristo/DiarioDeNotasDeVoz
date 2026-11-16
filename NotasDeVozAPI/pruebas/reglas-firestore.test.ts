import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function leer(archivo: string): string {
  return readFileSync(new URL(`../${archivo}`, import.meta.url), "utf8");
}

describe("configuración de Firestore", () => {
  it("las reglas niegan toda lectura y escritura a los clientes", () => {
    const reglas = leer("firestore.rules");
    const permisos = reglas.match(/allow[^;]*;/g) ?? [];

    expect(reglas).toContain("match /{document=**}");
    expect(permisos).toEqual(["allow read, write: if false;"]);
  });

  it("firebase.json apunta a las reglas y a los índices versionados", () => {
    const config: unknown = JSON.parse(leer("firebase.json"));

    expect(config).toEqual({
      firestore: { rules: "firestore.rules", indexes: "firestore.indexes.json" },
    });
  });

  it("el archivo de índices es JSON válido con su lista de índices", () => {
    const indices: unknown = JSON.parse(leer("firestore.indexes.json"));

    expect(indices).toHaveProperty("indexes");
  });
});
