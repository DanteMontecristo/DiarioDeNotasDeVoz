import { fireEvent, render, screen } from "@testing-library/react-native";
import { InterruptorLugar } from "./InterruptorLugar";

const alCambiar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("InterruptorLugar", () => {
  it("es un interruptor con etiqueta accesible que refleja si está activo", async () => {
    await render(<InterruptorLugar activo={false} aviso={null} alCambiar={alCambiar} />);

    expect(screen.getByRole("switch", { name: "Guardar el lugar de la nota" })).toHaveProp(
      "value",
      false,
    );
  });

  it("avisa cuando el usuario lo cambia", async () => {
    await render(<InterruptorLugar activo={false} aviso={null} alCambiar={alCambiar} />);

    await fireEvent(screen.getByRole("switch"), "valueChange", true);

    expect(alCambiar).toHaveBeenCalledWith(true);
  });

  it("explica para qué se usa la ubicación", async () => {
    await render(<InterruptorLugar activo={false} aviso={null} alCambiar={alCambiar} />);

    expect(screen.getByText(/solo al guardar una nota/)).toBeTruthy();
  });

  it("muestra el aviso cuando no se pudo activar", async () => {
    await render(
      <InterruptorLugar
        activo={false}
        aviso="No hay permiso de ubicación."
        alCambiar={alCambiar}
      />,
    );

    expect(screen.getByText("No hay permiso de ubicación.")).toBeTruthy();
  });
});
