// Textos e iconos del registro de ocio, y el cálculo del equilibrio estudio / ocio.
import { BookOpen, Clapperboard, Gamepad2, Music, Sparkles, Tv } from 'lucide-react';

export const TIPOS_OCIO = [
  { valor: 'videojuego', texto: 'Videojuego', Icono: Gamepad2 },
  { valor: 'serie', texto: 'Serie', Icono: Tv },
  { valor: 'pelicula', texto: 'Película', Icono: Clapperboard },
  { valor: 'libro', texto: 'Libro', Icono: BookOpen },
  { valor: 'musica', texto: 'Música', Icono: Music },
  { valor: 'otro', texto: 'Otro', Icono: Sparkles },
];

export const ESTADOS_OCIO = [
  { valor: 'en_curso', texto: 'En curso' },
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'terminado', texto: 'Terminado' },
  { valor: 'abandonado', texto: 'Lo dejé' },
];

export const tipoOcio = (valor) => TIPOS_OCIO.find((t) => t.valor === valor) || TIPOS_OCIO[TIPOS_OCIO.length - 1];
export const estadoOcio = (valor) => ESTADOS_OCIO.find((e) => e.valor === valor)?.texto || valor;

// Qué parte del tiempo de la semana fue estudio y qué parte ocio (porcentajes que suman 100).
export function equilibrio(minutosEstudio, minutosOcio) {
  const total = minutosEstudio + minutosOcio;
  if (total === 0) return { estudio: 0, ocio: 0, mensaje: 'Aún no hay tiempo registrado esta semana.' };
  const estudio = Math.round((minutosEstudio / total) * 100);
  const ocio = 100 - estudio;
  let mensaje = 'Buen equilibrio entre estudio y descanso.';
  if (ocio === 0) mensaje = 'Esta semana solo estudiaste. Date un rato para algo que disfrutes.';
  else if (ocio > 60) mensaje = 'El ocio va ganando esta semana. Una sesión de enfoque te pone al día.';
  else if (ocio < 15) mensaje = 'Vas muy enfocado. Un descanso también suma.';
  return { estudio, ocio, mensaje };
}
