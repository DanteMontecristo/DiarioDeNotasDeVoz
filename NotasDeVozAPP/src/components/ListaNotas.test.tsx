import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Nota } from "@/repositories/notasRepositorio";
import { ListaNotas } from "./ListaNotas";

function nota(cambios: Partial<Nota> = {}): Nota {
  return {
    id: 1,
    titulo: "Idea para el proyecto",
    archivoUri: "file:///notas/1.m4a",
    duracionMs: 125000,
    etiqueta: null,
    lat: null,
    lng: null,
    creadaEn: new Date(2026, 10, 1, 15, 4).toISOString(),
    remoteId: "remoto-1",
    updatedAt: "",
    pendiente: false,
    ...cambios,
  };
}

const alBuscar = jest.fn();
const alAbrir = jest.fn();

async function mostrar(notas: Nota[], busqueda = "", cargando = false): Promise<void> {
  await render(
    <ListaNotas
      notas={notas}
      busqueda={busqueda}
      cargando={cargando}
      alBuscar={alBuscar}
      alAbrir={alAbrir}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ListaNotas con notas", () => {
  it("muestra el título, la duración y la fecha de cada nota", async () => {
    await mostrar([nota()]);

    expect(screen.getByText("Idea para el proyecto")).toBeTruthy();
    expect(screen.getByText("2:05 · 01/11/2026 15:04")).toBeTruthy();
  });

  it("muestra la etiqueta cuando la nota tiene una", async () => {
    await mostrar([nota({ etiqueta: "clase" })]);

    expect(screen.getByText("clase")).toBeTruthy();
  });

  it("cada nota es un botón que describe la nota completa a un lector de pantalla", async () => {
    await mostrar([nota({ etiqueta: "clase" })]);

    expect(
      screen.getByRole("button", {
        name: "Idea para el proyecto, etiqueta clase, duración 2:05, 01/11/2026 15:04",
      }),
    ).toBeTruthy();
  });

  it("al tocar una nota la abre por su id", async () => {
    await mostrar([nota({ id: 7 })]);

    await fireEvent.press(screen.getByRole("button", { name: /Idea para el proyecto/ }));

    expect(alAbrir).toHaveBeenCalledWith(7);
  });
});

describe("ListaNotas: búsqueda", () => {
  it("tiene un campo de búsqueda con etiqueta accesible que avisa lo que se escribe", async () => {
    await mostrar([nota()]);

    await fireEvent.changeText(screen.getByLabelText("Buscar por título o etiqueta"), "clase");

    expect(alBuscar).toHaveBeenCalledWith("clase");
  });

  it("si la búsqueda no encuentra nada, lo dice con el texto buscado", async () => {
    await mostrar([], "xyz");

    expect(screen.getByText("Ninguna nota coincide con «xyz».")).toBeTruthy();
  });
});

describe("ListaNotas vacía", () => {
  it("sin notas ni búsqueda invita a grabar la primera", async () => {
    await mostrar([]);

    expect(screen.getByText("Aún no hay notas")).toBeTruthy();
    expect(screen.getByText(/pestaña Grabar/)).toBeTruthy();
  });

  it("mientras carga no afirma que no hay notas", async () => {
    await mostrar([], "", true);

    expect(screen.queryByText("Aún no hay notas")).toBeNull();
    expect(screen.getByText("Cargando notas…")).toBeTruthy();
  });
});
