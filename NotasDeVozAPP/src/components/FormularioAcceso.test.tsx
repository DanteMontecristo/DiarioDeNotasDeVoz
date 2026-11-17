import { fireEvent, render, screen } from "@testing-library/react-native";
import { FormularioAcceso } from "./FormularioAcceso";

const alEnviar = jest.fn();
const alCambiarModo = jest.fn();

type Extra = { modo?: "entrar" | "registrar"; error?: string | null; ocupado?: boolean };

async function mostrar({ modo = "entrar", error = null, ocupado = false }: Extra = {}) {
  await render(
    <FormularioAcceso
      modo={modo}
      error={error}
      ocupado={ocupado}
      alEnviar={alEnviar}
      alCambiarModo={alCambiarModo}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FormularioAcceso", () => {
  it("envía el correo y la contraseña escritos", async () => {
    await mostrar();

    await fireEvent.changeText(screen.getByLabelText("Correo"), "ana@correo.test");
    await fireEvent.changeText(screen.getByLabelText("Contraseña"), "secreta-123");
    await fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(alEnviar).toHaveBeenCalledWith("ana@correo.test", "secreta-123");
  });

  it("oculta la contraseña mientras se escribe", async () => {
    await mostrar();

    expect(screen.getByLabelText("Contraseña")).toHaveProp("secureTextEntry", true);
  });

  it("en modo registro cambia el botón y avisa del mínimo de la contraseña", async () => {
    await mostrar({ modo: "registrar" });

    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeTruthy();
    expect(screen.getByText(/al menos 8 caracteres/)).toBeTruthy();
  });

  it("permite pasar de iniciar sesión a crear cuenta", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "No tengo cuenta: crear una" }));

    expect(alCambiarModo).toHaveBeenCalledTimes(1);
  });

  it("muestra el error como alerta", async () => {
    await mostrar({ error: "Credenciales inválidas" });

    expect(screen.getByRole("alert")).toHaveTextContent("Credenciales inválidas");
  });

  it("mientras está ocupado no deja enviar dos veces", async () => {
    await mostrar({ ocupado: true });

    await fireEvent.press(screen.getByRole("button", { name: "Enviando…" }));

    expect(alEnviar).not.toHaveBeenCalled();
  });
});
