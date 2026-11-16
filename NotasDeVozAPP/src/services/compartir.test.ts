import * as Sharing from "expo-sharing";
import { compartirAudio } from "./compartir";

jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const disponible = jest.mocked(Sharing.isAvailableAsync);
const compartir = jest.mocked(Sharing.shareAsync);
const URI = "file:///documentos/notas/uuid-1.m4a";

beforeEach(() => {
  jest.resetAllMocks();
  disponible.mockResolvedValue(true);
  compartir.mockResolvedValue();
});

describe("compartirAudio", () => {
  it("abre el diálogo del sistema con el archivo de la nota", async () => {
    expect(await compartirAudio(URI)).toEqual({ ok: true });
    expect(compartir).toHaveBeenCalledWith(URI, {
      mimeType: "audio/mp4",
      dialogTitle: "Compartir nota de voz",
    });
  });

  it("si el teléfono no permite compartir, lo explica y no lo intenta", async () => {
    disponible.mockResolvedValueOnce(false);

    expect(await compartirAudio(URI)).toEqual({
      ok: false,
      error: "Este teléfono no permite compartir archivos.",
    });
    expect(compartir).not.toHaveBeenCalled();
  });

  it("si compartir falla, devuelve un mensaje en lugar de romper la app", async () => {
    compartir.mockRejectedValueOnce(new Error("archivo no encontrado"));

    expect(await compartirAudio(URI)).toEqual({
      ok: false,
      error: "No se pudo compartir el audio.",
    });
  });
});

describe("compartirAudio: tipo de archivo", () => {
  it.each([
    ["file:///notas/a.m4a", "audio/mp4"],
    ["file:///notas/a.3gp", "audio/3gpp"],
    ["file:///notas/a.caf", "audio/x-caf"],
    ["file:///notas/a.xyz", "audio/*"],
  ])("comparte %s como %s", async (uri, mimeType) => {
    await compartirAudio(uri);

    expect(compartir).toHaveBeenCalledWith(uri, expect.objectContaining({ mimeType }));
  });
});
