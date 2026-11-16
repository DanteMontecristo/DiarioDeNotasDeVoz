import { fireEvent, render, screen } from "@testing-library/react-native";
import { AJUSTES_POR_DEFECTO } from "@/utils/ajustes";
import { FormularioAjustes } from "./FormularioAjustes";

const alCambiar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FormularioAjustes", () => {
  it("marca como seleccionadas las opciones actuales", async () => {
    await render(<FormularioAjustes ajustes={AJUSTES_POR_DEFECTO} alCambiar={alCambiar} />);

    expect(screen.getByRole("radio", { name: "Calidad alta" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Calidad baja" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Límite de 2 minutos" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Límite de 30 segundos" })).not.toBeChecked();
  });

  it("al elegir otra calidad avisa solo ese cambio", async () => {
    await render(<FormularioAjustes ajustes={AJUSTES_POR_DEFECTO} alCambiar={alCambiar} />);

    await fireEvent.press(screen.getByRole("radio", { name: "Calidad baja" }));

    expect(alCambiar).toHaveBeenCalledWith({ calidad: "baja" });
  });

  it("al elegir otro límite avisa solo ese cambio", async () => {
    await render(<FormularioAjustes ajustes={AJUSTES_POR_DEFECTO} alCambiar={alCambiar} />);

    await fireEvent.press(screen.getByRole("radio", { name: "Límite de 1 minuto" }));

    expect(alCambiar).toHaveBeenCalledWith({ limiteMs: 60000 });
  });

  it("cada grupo de opciones tiene su encabezado", async () => {
    await render(<FormularioAjustes ajustes={AJUSTES_POR_DEFECTO} alCambiar={alCambiar} />);

    expect(screen.getByRole("header", { name: "Calidad de grabación" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Límite de tiempo" })).toBeTruthy();
  });
});
