import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("responde 200 con ok y la hora del servidor en ISO 8601 UTC", async () => {
    const respuesta = GET();
    const cuerpo: unknown = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toEqual({
      ok: true,
      servidor_ahora: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });
});
