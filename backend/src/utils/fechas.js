// Funciones puras para trabajar con días en formato 'YYYY-MM-DD'.

// Devuelve la fecha local en formato 'YYYY-MM-DD'.
function aTextoDia(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

// Suma (o resta) días a un día 'YYYY-MM-DD' y devuelve otro texto 'YYYY-MM-DD'.
function sumarDias(dia, cantidad) {
  const [a, m, d] = dia.split('-').map(Number);
  // Se usa el mediodía para evitar saltos por cambios de horario.
  const f = new Date(a, m - 1, d, 12);
  f.setDate(f.getDate() + cantidad);
  return aTextoDia(f);
}

// Lista de los últimos `n` días terminando en `hoy`, del más antiguo al más reciente.
function ultimosDias(hoy, n) {
  const dias = [];
  for (let i = n - 1; i >= 0; i -= 1) dias.push(sumarDias(hoy, -i));
  return dias;
}

module.exports = { aTextoDia, sumarDias, ultimosDias };
