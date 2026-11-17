import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Resumen } from "@/services/resumenServicio";
import { PanelCuenta } from "./PanelCuenta";

const alSincronizar = jest.fn();
const alCerrarSesion = jest.fn();

const resumen: Resumen = {
  inicio: "2026-11-16",
  fin: "2026-11-22",
  dias: [
    { fecha: "2026-11-16", minutos: 1.5, notas: 2 },
    { fecha: "2026-11-17", minutos: 0, notas: 0 },
  ],
  totalMinutos: 1.5,
};

type Extra = { mensaje?: string | null; ocupado?: boolean; resumen?: Resumen | null };

async function mostrar({ mensaje = null, ocupado = false, resumen: datos = null }: Extra = {}) {
  await render(
    <PanelCuenta
      email="ana@correo.test"
      mensaje={mensaje}
      ocupado={ocupado}
      resumen={datos}
      alSincronizar={alSincronizar}
      alCerrarSesion={alCerrarSesion}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PanelCuenta", () => {
  it("muestra con qué correo se inició sesión", async () => {
    await mostrar();

    expect(screen.getByText("ana@correo.test")).toBeTruthy();
  });

  it("tiene un botón para sincronizar", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Sincronizar ahora" }));

    expect(alSincronizar).toHaveBeenCalledTimes(1);
  });

  it("mientras sincroniza lo indica y no lanza otra sincronización", async () => {
    await mostrar({ ocupado: true });

    await fireEvent.press(screen.getByRole("button", { name: "Sincronizando…" }));

    expect(alSincronizar).not.toHaveBeenCalled();
  });

  it("muestra el resultado de la última sincronización", async () => {
    await mostrar({ mensaje: "Enviadas: 2 · Recibidas: 1" });

    expect(screen.getByText("Enviadas: 2 · Recibidas: 1")).toBeTruthy();
  });

  it("muestra el resumen de la semana con el total y cada día", async () => {
    await mostrar({ resumen });

    expect(screen.getByRole("header", { name: "Esta semana" })).toBeTruthy();
    expect(screen.getByText("Total: 1,5 min")).toBeTruthy();
    expect(screen.getByText("16/11 · 1,5 min · 2 notas")).toBeTruthy();
    expect(screen.getByText("17/11 · 0 min · 0 notas")).toBeTruthy();
  });

  it("permite cerrar sesión", async () => {
    await mostrar();

    await fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
