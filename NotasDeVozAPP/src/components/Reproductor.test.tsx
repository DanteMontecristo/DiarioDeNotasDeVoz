import { fireEvent, render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { EstadoReproductor } from "@/sensors/useReproductor";
import { Reproductor } from "./Reproductor";

const mockAlternar = jest.fn();
const mockSaltar = jest.fn();
const mockIrA = jest.fn();
const mockCambiarVelocidad = jest.fn();
let mockEstado: EstadoReproductor;

jest.mock("@/sensors/useReproductor", () => ({ useReproductor: () => mockEstado }));

function estado(cambios: Partial<EstadoReproductor> = {}): EstadoReproductor {
  return {
    reproduciendo: false,
    posicionMs: 5000,
    duracionMs: 125000,
    velocidad: 1,
    alternar: mockAlternar,
    saltar: mockSaltar,
    irA: mockIrA,
    cambiarVelocidad: mockCambiarVelocidad,
    ...cambios,
  };
}

async function mostrar(): Promise<void> {
  await render(
    <GestureHandlerRootView>
      <Reproductor uri="file:///notas/1.m4a" duracionMs={125000} />
    </GestureHandlerRootView>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEstado = estado();
});

describe("Reproductor: lo que muestra", () => {
  it("muestra la posición y la duración", async () => {
    await mostrar();

    expect(screen.getByText("0:05 / 2:05")).toBeTruthy();
  });

  it("la barra de progreso informa su avance a los lectores de pantalla", async () => {
    await mostrar();

    expect(screen.getByLabelText("Posición de reproducción")).toHaveProp("accessibilityValue", {
      min: 0,
      max: 125,
      now: 5,
      text: "0:05 de 2:05",
    });
  });

  it("el botón principal dice Pausar mientras reproduce", async () => {
    mockEstado = estado({ reproduciendo: true });
    await mostrar();

    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reproducir" })).toBeNull();
  });
});

describe("Reproductor: botones alternativos a los gestos", () => {
  it("Reproducir alterna la reproducción", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Reproducir" }));

    expect(mockAlternar).toHaveBeenCalledTimes(1);
  });

  it("hay botones para avanzar y retroceder 10 segundos", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Avanzar 10 segundos" }));
    await fireEvent.press(screen.getByRole("button", { name: "Retroceder 10 segundos" }));

    expect(mockSaltar.mock.calls).toEqual([["adelante"], ["atras"]]);
  });

  it("el botón de velocidad muestra la actual y la cambia", async () => {
    mockEstado = estado({ velocidad: 1.5 });
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Velocidad 1,5×, cambiar" }));

    expect(mockCambiarVelocidad).toHaveBeenCalledTimes(1);
  });

  it("la barra se puede mover con las acciones de accesibilidad", async () => {
    await mostrar();
    const barra = screen.getByLabelText("Posición de reproducción");

    await fireEvent(barra, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    await fireEvent(barra, "accessibilityAction", { nativeEvent: { actionName: "decrement" } });

    expect(mockSaltar.mock.calls).toEqual([["adelante"], ["atras"]]);
  });
});
