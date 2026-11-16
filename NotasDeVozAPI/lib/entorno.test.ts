import { describe, expect, it } from "vitest";
import { leerEntorno } from "./entorno";

const completo = {
  FIREBASE_PROJECT_ID: "demo-notas-de-voz",
  FIREBASE_CLIENT_EMAIL: "cuenta-falsa@demo-notas-de-voz.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: "LINEA-1\\nLINEA-2\\n",
  FIREBASE_WEB_API_KEY: "CLAVE-FALSA-NO-ES-UN-SECRETO",
};

describe("leerEntorno", () => {
  it("devuelve las variables con nombres propios del código", () => {
    expect(leerEntorno(completo)).toMatchObject({
      projectId: "demo-notas-de-voz",
      clientEmail: "cuenta-falsa@demo-notas-de-voz.iam.gserviceaccount.com",
      webApiKey: "CLAVE-FALSA-NO-ES-UN-SECRETO",
    });
  });

  it("convierte los \\n literales de la clave privada en saltos de línea", () => {
    expect(leerEntorno(completo).privateKey).toBe("LINEA-1\nLINEA-2\n");
  });

  it("falla nombrando la variable que falta, sin revelar ningún valor", () => {
    const incompleto = { ...completo, FIREBASE_WEB_API_KEY: undefined };
    let mensaje = "";
    try {
      leerEntorno(incompleto);
    } catch (error) {
      mensaje = error instanceof Error ? error.message : "";
    }

    expect(mensaje).toContain("FIREBASE_WEB_API_KEY");
    expect(mensaje).not.toContain("LINEA-1");
    expect(mensaje).not.toContain("demo-notas-de-voz");
  });

  it("rechaza una variable vacía", () => {
    expect(() => leerEntorno({ ...completo, FIREBASE_PROJECT_ID: "" })).toThrow(
      "FIREBASE_PROJECT_ID",
    );
  });
});
