import { FormularioAjustes } from "@/components/FormularioAjustes";
import { useAjustes } from "@/services/useAjustes";

export default function PantallaAjustes() {
  const { ajustes, cambiar } = useAjustes();

  return <FormularioAjustes ajustes={ajustes} alCambiar={cambiar} />;
}
