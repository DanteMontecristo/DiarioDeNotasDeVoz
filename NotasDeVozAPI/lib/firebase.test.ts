import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = vi.hoisted(() => {
  const apps: object[] = [];
  return {
    apps,
    cert: vi.fn((cuenta: object) => ({ cuenta })),
    initializeApp: vi.fn(() => {
      const app = { nombre: "app-falsa" };
      apps.push(app);
      return app;
    }),
    getApps: vi.fn(() => apps),
    getAuth: vi.fn(() => ({ tipo: "auth" })),
    getFirestore: vi.fn(() => ({ tipo: "firestore" })),
  };
});

vi.mock("firebase-admin/app", () => ({
  cert: admin.cert,
  initializeApp: admin.initializeApp,
  getApps: admin.getApps,
}));
vi.mock("firebase-admin/auth", () => ({ getAuth: admin.getAuth }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: admin.getFirestore }));

import { obtenerAuth, obtenerDb } from "./firebase";

describe("firebase", () => {
  beforeEach(() => {
    admin.apps.length = 0;
    vi.clearAllMocks();
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-notas-de-voz");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "cuenta-falsa@demo.iam.gserviceaccount.com");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "LINEA-1\\nLINEA-2\\n");
    vi.stubEnv("FIREBASE_WEB_API_KEY", "CLAVE-FALSA-NO-ES-UN-SECRETO");
  });

  it("inicia Firebase Admin con la cuenta de servicio del entorno", () => {
    obtenerAuth();

    expect(admin.cert).toHaveBeenCalledWith({
      projectId: "demo-notas-de-voz",
      clientEmail: "cuenta-falsa@demo.iam.gserviceaccount.com",
      privateKey: "LINEA-1\nLINEA-2\n",
    });
    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
  });

  it("reutiliza la misma app en llamadas posteriores", () => {
    obtenerAuth();
    obtenerDb();
    obtenerAuth();

    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
  });

  it("entrega Auth y Firestore de la app iniciada", () => {
    expect(obtenerAuth()).toEqual({ tipo: "auth" });
    expect(obtenerDb()).toEqual({ tipo: "firestore" });
    expect(admin.getAuth).toHaveBeenCalledWith({ nombre: "app-falsa" });
    expect(admin.getFirestore).toHaveBeenCalledWith({ nombre: "app-falsa" });
  });
});
