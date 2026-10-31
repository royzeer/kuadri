// Utilidades de precios para la lista de deseos (funciones puras, fáciles de probar).

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatearPesos(valor) {
  if (valor === null || valor === undefined) return 'Sin precio';
  return pesos.format(valor);
}

// Texto corto que compara el precio de hoy con el que el usuario quiere pagar.
export function estadoPrecio({ precio_actual: actual, precio_objetivo: objetivo }) {
  if (actual === null) return { texto: 'Aún no anotas el precio', listo: false };
  if (objetivo === null) return { texto: 'Sin precio objetivo', listo: false };
  if (actual <= objetivo) return { texto: 'Llegó a tu precio', listo: true };
  return { texto: `Faltan ${formatearPesos(actual - objetivo)}`, listo: false };
}

// Convierte el historial en puntos "x,y" para una línea SVG de ancho x alto.
// El precio más alto queda arriba y el más bajo abajo, con un margen para que la línea no toque el borde.
export function puntosGrafico(historial, ancho, alto, margen = 10) {
  if (historial.length === 0) return [];
  const precios = historial.map((p) => p.precio);
  const max = Math.max(...precios);
  const min = Math.min(...precios);
  const rango = max - min || 1;
  const paso = historial.length > 1 ? (ancho - margen * 2) / (historial.length - 1) : 0;
  return precios.map((precio, i) => ({
    x: historial.length > 1 ? margen + i * paso : ancho / 2,
    y: max === min ? alto / 2 : margen + ((max - precio) / rango) * (alto - margen * 2),
  }));
}
