import { nombrarLugar, obtenerLugar, pedirPermisoUbicacion } from "./ubicacion";

// Simulacros sin tipo: cada prueba devuelve solo los campos que el servicio lee.
// Jest exige el prefijo «mock» para poder usarlos dentro de jest.mock.
const mockServicios = jest.fn();
const mockPermiso = jest.fn();
const mockUltima = jest.fn();
const mockActual = jest.fn();
const mockGeocodificar = jest.fn();

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  hasServicesEnabledAsync: () => mockServicios(),
  requestForegroundPermissionsAsync: () => mockPermiso(),
  getLastKnownPositionAsync: () => mockUltima(),
  getCurrentPositionAsync: (opciones: object) => mockActual(opciones),
  reverseGeocodeAsync: (punto: object) => mockGeocodificar(punto),
}));

function posicion(latitude: number, longitude: number) {
  return { coords: { latitude, longitude } };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockServicios.mockResolvedValue(true);
});

describe("pedirPermisoUbicacion", () => {
  it("devuelve true si el usuario lo concede", async () => {
    mockPermiso.mockResolvedValueOnce({ granted: true });

    expect(await pedirPermisoUbicacion()).toBe(true);
  });

  it("devuelve false si lo niega o si pedirlo falla", async () => {
    mockPermiso.mockResolvedValueOnce({ granted: false });
    expect(await pedirPermisoUbicacion()).toBe(false);

    mockPermiso.mockRejectedValueOnce(new Error("sin servicio"));
    expect(await pedirPermisoUbicacion()).toBe(false);
  });

  it("no pide el permiso si la ubicación del teléfono está apagada", async () => {
    mockServicios.mockResolvedValueOnce(false);

    expect(await pedirPermisoUbicacion()).toBe(false);
    expect(mockPermiso).not.toHaveBeenCalled();
  });
});

describe("obtenerLugar", () => {
  it("usa la última posición conocida, que es inmediata", async () => {
    mockUltima.mockResolvedValueOnce(posicion(6.2442, -75.5812));

    expect(await obtenerLugar()).toEqual({ lat: 6.2442, lng: -75.5812 });
    expect(mockActual).not.toHaveBeenCalled();
  });

  it("si no hay última posición, pide la actual", async () => {
    mockUltima.mockResolvedValueOnce(null);
    mockActual.mockResolvedValueOnce(posicion(4.711, -74.0721));

    expect(await obtenerLugar()).toEqual({ lat: 4.711, lng: -74.0721 });
  });

  it("devuelve null si el sensor falla: la nota se guarda sin lugar", async () => {
    mockUltima.mockRejectedValueOnce(new Error("sin GPS"));

    expect(await obtenerLugar()).toBeNull();
  });
});

describe("nombrarLugar", () => {
  it("devuelve la ciudad de las coordenadas", async () => {
    mockGeocodificar.mockResolvedValueOnce([{ city: "Medellín", region: "Antioquia" }]);

    expect(await nombrarLugar(6.2442, -75.5812)).toBe("Medellín");
    expect(mockGeocodificar).toHaveBeenCalledWith({ latitude: 6.2442, longitude: -75.5812 });
  });

  it("devuelve null si no hay resultado o si la consulta falla (por ejemplo, sin conexión)", async () => {
    mockGeocodificar.mockResolvedValueOnce([]);
    expect(await nombrarLugar(0, 0)).toBeNull();

    mockGeocodificar.mockRejectedValueOnce(new Error("sin red"));
    expect(await nombrarLugar(0, 0)).toBeNull();
  });
});
