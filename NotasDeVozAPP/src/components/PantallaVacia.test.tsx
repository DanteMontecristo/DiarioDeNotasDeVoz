import { render, screen } from "@testing-library/react-native";
import { PantallaVacia } from "./PantallaVacia";

describe("PantallaVacia", () => {
  it("muestra el título como encabezado accesible", async () => {
    await render(<PantallaVacia titulo="Mis notas" descripcion="Aún no hay notas." />);

    expect(screen.getByRole("header", { name: "Mis notas" })).toBeTruthy();
  });

  it("muestra la descripción", async () => {
    await render(<PantallaVacia titulo="Mis notas" descripcion="Aún no hay notas." />);

    expect(screen.getByText("Aún no hay notas.")).toBeTruthy();
  });
});
