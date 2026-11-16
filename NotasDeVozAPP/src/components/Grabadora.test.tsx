import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { EstadoGrabadora } from "@/sensors/useGrabadora";
import { Grabadora } from "./Grabadora";

const mockIniciar = jest.fn();
const mockTerminar = jest.fn();
let mockEstado: EstadoGrabadora;

jest.mock("@/sensors/useGrabadora", () => ({ useGrabadora: () => mockEstado }));

function estado(cambios: Partial<EstadoGrabadora> = {}): EstadoGrabadora {
  return {
    grabando: false,
    duracionMs: 0,
    nivel: 0,
    permisoNegado: false,
    iniciar: mockIniciar,
    terminar: mockTerminar,
    ...cambios,
  };
}

/** Igual que en la app: la grabadora vive dentro de la raíz de gestos. */
async function mostrar(mensaje: string | null = null): Promise<void> {
  await render(
    <GestureHandlerRootView>
      <Grabadora alTerminar={jest.fn()} mensaje={mensaje} />
    </GestureHandlerRootView>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEstado = estado();
});

describe("Grabadora en reposo", () => {
  it("ofrece un botón accesible para empezar a grabar sin usar el gesto", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Iniciar grabación" }));

    expect(mockIniciar).toHaveBeenCalledTimes(1);
  });

  it("muestra el mensaje del último resultado", async () => {
    await mostrar("Nota guardada (0:05).");

    expect(screen.getByText("Nota guardada (0:05).")).toBeTruthy();
  });

  it("no muestra los botones de detener ni cancelar", async () => {
    await mostrar();

    expect(screen.queryByRole("button", { name: "Detener y guardar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar grabación" })).toBeNull();
  });
});

describe("Grabadora grabando", () => {
  beforeEach(() => {
    mockEstado = estado({ grabando: true, duracionMs: 5000, nivel: 0.5 });
  });

  it("muestra el tiempo transcurrido y el límite", async () => {
    await mostrar();

    expect(screen.getByText("0:05 / 2:00")).toBeTruthy();
  });

  it("expone el nivel de voz a los lectores de pantalla", async () => {
    await mostrar();

    expect(screen.getByLabelText("Nivel de voz")).toHaveProp("accessibilityValue", {
      min: 0,
      max: 100,
      now: 50,
    });
  });

  it("el botón Detener guarda la grabación", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Detener y guardar" }));

    expect(mockTerminar).toHaveBeenCalledWith(true);
  });

  it("el botón Cancelar la descarta", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar grabación" }));

    expect(mockTerminar).toHaveBeenCalledWith(false);
  });
});

describe("Grabadora sin permiso de micrófono", () => {
  beforeEach(() => {
    mockEstado = estado({ permisoNegado: true });
  });

  it("explica cómo habilitar el micrófono", async () => {
    await mostrar();

    expect(screen.getByText(/permiso para usar el micrófono/)).toBeTruthy();
  });

  it("ofrece abrir los ajustes del teléfono", async () => {
    const abrir = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Abrir ajustes del teléfono" }));

    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it("deja disponible el botón para volver a intentarlo", async () => {
    await mostrar();

    expect(screen.getByRole("button", { name: "Iniciar grabación" })).toBeTruthy();
  });
});
