// Elige texto blanco o negro según qué tan oscuro sea el color de fondo (contraste accesible).
export function colorTexto(hex) {
  const limpio = (hex || '').replace('#', '');
  if (limpio.length !== 6) return '#161616';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16) / 255);
  // Luminancia relativa (fórmula de WCAG)
  const canal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminancia = 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  return luminancia < 0.3 ? '#FFFFFF' : '#161616';
}

// Paleta para las categorías
export const COLORES_CATEGORIA = ['#3359FF', '#FF7438', '#46D9A0', '#C7B8FF', '#EEFF5C', '#FF9EC4', '#7FD8FF', '#B9B6AD'];
