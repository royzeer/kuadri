// Traduce los nombres de iconos guardados en la base de datos a iconos de lucide-react.
import {
  BookOpen,
  Brush,
  Clock,
  Code,
  Coffee,
  Flag,
  Flame,
  Folder,
  Gamepad2,
  Heart,
  Plane,
  CircleCheck,
  Sun,
  Tag,
  Trophy,
  Wallet,
  Zap,
} from 'lucide-react';

const ICONOS = {
  carpeta: Folder,
  libro: BookOpen,
  codigo: Code,
  corazon: Heart,
  rayo: Zap,
  cafe: Coffee,
  avion: Plane,
  pincel: Brush,
  control: Gamepad2,
  dinero: Wallet,
  // Iconos de logros
  bandera: Flag,
  llama: Flame,
  check: CircleCheck,
  reloj: Clock,
  sol: Sun,
  trofeo: Trophy,
  etiqueta: Tag,
};

export const ICONOS_CATEGORIA = ['carpeta', 'libro', 'codigo', 'corazon', 'rayo', 'cafe', 'avion', 'pincel', 'control', 'dinero'];

export default function Icono({ nombre, size = 26, ...resto }) {
  const Componente = ICONOS[nombre] || Folder;
  return <Componente size={size} strokeWidth={2.4} aria-hidden="true" {...resto} />;
}
