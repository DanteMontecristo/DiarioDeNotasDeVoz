/**
 * Firestore en memoria para las pruebas: solo imita lo que usa la API
 * (colecciones por ruta, documentos, una consulta simple y transacciones).
 */
type Datos = Record<string, unknown>;
type Almacen = Map<string, Datos>;
type Operador = ">" | ">=" | "<";
type Filtro = { campo: string; operador: Operador; valor: string };
type Opciones = { filtros: Filtro[]; orden: string | null; tope: number };

const COMPARAR: Record<Operador, (dato: string, valor: string) => boolean> = {
  ">": (dato, valor) => dato > valor,
  ">=": (dato, valor) => dato >= valor,
  "<": (dato, valor) => dato < valor,
};

function cumple(datos: Datos, filtros: Filtro[]): boolean {
  return filtros.every(({ campo, operador, valor }) =>
    COMPARAR[operador](String(datos[campo]), valor),
  );
}

class InstantaneaFalsa {
  constructor(
    readonly id: string,
    private readonly datos: Datos | undefined,
  ) {}

  get exists(): boolean {
    return this.datos !== undefined;
  }

  data(): Datos | undefined {
    return this.datos ? { ...this.datos } : undefined;
  }
}

class ReferenciaFalsa {
  constructor(
    private readonly almacen: Almacen,
    private readonly ruta: string,
    readonly id: string,
  ) {}

  private get clave(): string {
    return `${this.ruta}/${this.id}`;
  }

  leer(): InstantaneaFalsa {
    return new InstantaneaFalsa(this.id, this.almacen.get(this.clave));
  }

  escribir(datos: Datos): void {
    this.almacen.set(this.clave, { ...datos });
  }

  fusionar(cambios: Datos): void {
    this.escribir({ ...this.almacen.get(this.clave), ...cambios });
  }
}

class ConsultaFalsa {
  constructor(
    protected readonly almacen: Almacen,
    protected readonly ruta: string,
    private readonly opciones: Opciones = { filtros: [], orden: null, tope: Infinity },
  ) {}

  where(campo: string, operador: Operador, valor: string): ConsultaFalsa {
    return this.con({ filtros: [...this.opciones.filtros, { campo, operador, valor }] });
  }

  orderBy(campo: string): ConsultaFalsa {
    return this.con({ orden: campo });
  }

  limit(tope: number): ConsultaFalsa {
    return this.con({ tope });
  }

  get(): Promise<{ docs: InstantaneaFalsa[] }> {
    const { filtros, orden, tope } = this.opciones;
    const prefijo = `${this.ruta}/`;
    const filas = [...this.almacen.entries()]
      .filter(([clave]) => clave.startsWith(prefijo) && !clave.slice(prefijo.length).includes("/"))
      .filter(([, datos]) => cumple(datos, filtros))
      .sort(([, a], [, b]) => (orden ? String(a[orden]).localeCompare(String(b[orden])) : 0))
      .slice(0, tope);
    const docs = filas.map(
      ([clave, datos]) => new InstantaneaFalsa(clave.slice(prefijo.length), datos),
    );
    return Promise.resolve({ docs });
  }

  private con(cambios: Partial<Opciones>): ConsultaFalsa {
    return new ConsultaFalsa(this.almacen, this.ruta, { ...this.opciones, ...cambios });
  }
}

class ColeccionFalsa extends ConsultaFalsa {
  doc(id: string): ReferenciaFalsa {
    return new ReferenciaFalsa(this.almacen, this.ruta, id);
  }
}

class TransaccionFalsa {
  private escribio = false;

  get(referencia: ReferenciaFalsa): Promise<InstantaneaFalsa> {
    if (this.escribio) {
      throw new Error("En una transacción de Firestore todas las lecturas van antes");
    }
    return Promise.resolve(referencia.leer());
  }

  set(referencia: ReferenciaFalsa, datos: Datos): void {
    this.escribio = true;
    referencia.escribir(datos);
  }

  update(referencia: ReferenciaFalsa, cambios: Datos): void {
    this.escribio = true;
    referencia.fusionar(cambios);
  }
}

export class FirestoreFalso {
  private readonly almacen: Almacen = new Map();

  collection(ruta: string): ColeccionFalsa {
    return new ColeccionFalsa(this.almacen, ruta);
  }

  runTransaction<T>(accion: (transaccion: TransaccionFalsa) => Promise<T>): Promise<T> {
    return accion(new TransaccionFalsa());
  }
}
