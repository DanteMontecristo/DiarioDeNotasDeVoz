import { fireEvent, render, screen } from "@testing-library/react-native";
import { EditorNota } from "./EditorNota";

const alGuardar = jest.fn();

async function mostrar(error: string | null = null): Promise<void> {
  await render(<EditorNota titulo="Idea" etiqueta="clase" error={error} alGuardar={alGuardar} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("EditorNota", () => {
  it("muestra el título y la etiqueta actuales en campos con etiqueta accesible", async () => {
    await mostrar();

    expect(screen.getByLabelText("Título")).toHaveProp("value", "Idea");
    expect(screen.getByLabelText("Etiqueta (opcional)")).toHaveProp("value", "clase");
  });

  it("guarda lo que el usuario escribió", async () => {
    await mostrar();

    await fireEvent.changeText(screen.getByLabelText("Título"), "Idea corregida");
    await fireEvent.changeText(screen.getByLabelText("Etiqueta (opcional)"), "casa");
    await fireEvent.press(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(alGuardar).toHaveBeenCalledWith({ titulo: "Idea corregida", etiqueta: "casa" });
  });

  it("una etiqueta vacía se guarda como null", async () => {
    await mostrar();

    await fireEvent.changeText(screen.getByLabelText("Etiqueta (opcional)"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(alGuardar).toHaveBeenCalledWith({ titulo: "Idea", etiqueta: null });
  });

  it("muestra el error de validación como alerta", async () => {
    await mostrar("El título puede tener máximo 60 caracteres.");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El título puede tener máximo 60 caracteres.",
    );
  });
});
