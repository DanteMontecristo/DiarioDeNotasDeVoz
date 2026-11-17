import { ErrorCliente } from "@/api/clienteHttp";
import { obtenerResumen } from "./resumenServicio";

const respuesta = {
  semana: { inicio: "2026-11-16", fin: "2026-11-22" },
  dias: [
    { fecha: "2026-11-16", minutos: 1.5, notas: 2 },
    { fecha: "2026-11-17", minutos: 0, notas: 0 },
  ],
  total_minutos: 1.5,
};

let privada: jest.Mock<Promise<unknown>, [string, string, unknown?]>;

beforeEach(() => {
  privada = jest.fn((_metodo: string, _ruta: string, _cuerpo?: unknown) =>
    Promise.resolve<unknown>(respuesta),
  );
});

describe("obtenerResumen", () => {
  it("pide el resumen con el desfase horario del teléfono y lo devuelve", async () => {
    const resultado = await obtenerResumen({ privada }, -300);

    expect(privada).toHaveBeenCalledWith("GET", "/api/notas-voz/resumen?desfase_min=-300");
    expect(resultado).toEqual({
      ok: true,
      resumen: {
        inicio: "2026-11-16",
        fin: "2026-11-22",
        dias: respuesta.dias,
        totalMinutos: 1.5,
      },
    });
  });

  it("descarta los días que no tienen la forma esperada", async () => {
    privada.mockResolvedValueOnce({
      ...respuesta,
      dias: [{ fecha: "2026-11-16" }, respuesta.dias[1]],
    });

    const resultado = await obtenerResumen({ privada }, 0);

    expect(resultado).toMatchObject({ ok: true, resumen: { dias: [respuesta.dias[1]] } });
  });

  it("si la respuesta no es un resumen, lo dice", async () => {
    privada.mockResolvedValueOnce({ otra: "cosa" });

    expect(await obtenerResumen({ privada }, 0)).toEqual({
      ok: false,
      error: "El servidor respondió algo inesperado.",
    });
  });

  it("muestra el mensaje de la API o de la red cuando falla", async () => {
    privada.mockRejectedValueOnce(new ErrorCliente(0, "No hay conexión con el servidor."));

    expect(await obtenerResumen({ privada }, 0)).toEqual({
      ok: false,
      error: "No hay conexión con el servidor.",
    });
  });
});
