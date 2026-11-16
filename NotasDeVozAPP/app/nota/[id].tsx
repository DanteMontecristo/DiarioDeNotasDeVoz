import { useLocalSearchParams } from "expo-router";
import { PantallaVacia } from "@/components/PantallaVacia";

export default function PantallaNota() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PantallaVacia
      titulo={`Nota ${id}`}
      descripcion="Aquí estará el reproductor, con velocidad, avance y retroceso."
    />
  );
}
