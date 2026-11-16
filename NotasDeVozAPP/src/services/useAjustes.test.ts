import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AJUSTES_POR_DEFECTO } from "@/utils/ajustes";
import { useAjustes } from "./useAjustes";

const mockObtener = jest.fn();
const mockCambiar = jest.fn();

// En las pruebas, «recibir el foco» equivale a montar la pantalla.
jest.mock("expo-router", () => ({
  useFocusEffect: (efecto: () => void) => jest.requireActual("react").useEffect(efecto, [efecto]),
}));
jest.mock("./dependencias", () => ({ obtenerDependencias: () => Promise.resolve({}) }));
jest.mock("./ajustesServicio", () => ({
  obtenerAjustes: () => mockObtener(),
  cambiarAjustes: (_deps: object, cambios: object) => mockCambiar(cambios),
}));

const guardados = { calidad: "baja", limiteMs: 30000, guardarLugar: true };

beforeEach(() => {
  jest.resetAllMocks();
  mockObtener.mockResolvedValue(guardados);
});

describe("useAjustes", () => {
  it("empieza con los valores por defecto y luego muestra los guardados", async () => {
    const { result } = await renderHook(() => useAjustes());

    await waitFor(() => expect(result.current.ajustes).toEqual(guardados));
  });

  it("si no se pueden leer, se queda con los valores por defecto", async () => {
    mockObtener.mockRejectedValue(new Error("base cerrada"));

    const { result } = await renderHook(() => useAjustes());

    await waitFor(() => expect(mockObtener).toHaveBeenCalled());
    expect(result.current.ajustes).toEqual(AJUSTES_POR_DEFECTO);
  });

  it("al cambiar un ajuste lo guarda y refleja lo que quedó guardado", async () => {
    mockCambiar.mockResolvedValue({ ...guardados, limiteMs: 60000 });
    const { result } = await renderHook(() => useAjustes());
    await waitFor(() => expect(result.current.ajustes).toEqual(guardados));

    await act(async () => result.current.cambiar({ limiteMs: 60000 }));

    expect(mockCambiar).toHaveBeenCalledWith({ limiteMs: 60000 });
    await waitFor(() => expect(result.current.ajustes.limiteMs).toBe(60000));
  });

  it("si guardar falla, no rompe la pantalla", async () => {
    mockCambiar.mockRejectedValue(new Error("disco lleno"));
    const { result } = await renderHook(() => useAjustes());
    await waitFor(() => expect(result.current.ajustes).toEqual(guardados));

    await act(async () => result.current.cambiar({ calidad: "alta" }));

    expect(result.current.ajustes.calidad).toBe("alta");
  });
});
