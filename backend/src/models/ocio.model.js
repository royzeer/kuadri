// Consultas del registro de ocio y de sus ratos.
const { query } = require('../config/db');

// Cada actividad de ocio viene con el total de minutos y el día del último rato.
const SELECT_OCIO = `
  SELECT o.id, o.titulo, o.tipo, o.estado, o.calificacion, o.plataforma, o.comentario, o.terminado_en, o.creado_en,
         COALESCE(SUM(r.minutos), 0) AS minutos_total,
         MAX(r.fecha) AS ultimo_rato
    FROM ocio o
    LEFT JOIN ocio_ratos r ON r.ocio_id = o.id`;

const aNumeros = (o) => ({ ...o, minutos_total: Number(o.minutos_total) });

async function listar(usuarioId) {
  const filas = await query(
    `${SELECT_OCIO}
      WHERE o.usuario_id = ?
      GROUP BY o.id
      ORDER BY FIELD(o.estado, 'en_curso', 'pendiente', 'terminado', 'abandonado'), ultimo_rato DESC, o.id DESC`,
    [usuarioId],
  );
  return filas.map(aNumeros);
}

async function buscar(usuarioId, id) {
  const filas = await query(`${SELECT_OCIO} WHERE o.id = ? AND o.usuario_id = ? GROUP BY o.id`, [id, usuarioId]);
  return filas[0] ? aNumeros(filas[0]) : null;
}

async function crear(usuarioId, d, ahora) {
  const r = await query(
    `INSERT INTO ocio (usuario_id, titulo, tipo, estado, calificacion, plataforma, comentario, terminado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, d.titulo, d.tipo, d.estado, d.calificacion, d.plataforma, d.comentario, d.estado === 'terminado' ? ahora : null],
  );
  return r.insertId;
}

// La fecha en que se terminó se guarda la primera vez y se borra si cambia de estado.
async function actualizar(usuarioId, id, d, ahora) {
  const r = await query(
    `UPDATE ocio
        SET titulo = ?, tipo = ?, estado = ?, calificacion = ?, plataforma = ?, comentario = ?,
            terminado_en = IF(? = 'terminado', COALESCE(terminado_en, ?), NULL)
      WHERE id = ? AND usuario_id = ?`,
    [d.titulo, d.tipo, d.estado, d.calificacion, d.plataforma, d.comentario, d.estado, ahora, id, usuarioId],
  );
  return r.affectedRows > 0;
}

async function cambiarEstado(usuarioId, id, estado) {
  await query('UPDATE ocio SET estado = ? WHERE id = ? AND usuario_id = ?', [estado, id, usuarioId]);
}

async function eliminar(usuarioId, id) {
  const r = await query('DELETE FROM ocio WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  return r.affectedRows > 0;
}

// ----- Ratos (siempre se valida antes que la actividad sea del usuario) -----
async function ratos(ocioId) {
  return query('SELECT id, minutos, fecha FROM ocio_ratos WHERE ocio_id = ? ORDER BY fecha DESC, id DESC', [ocioId]);
}

async function crearRato(ocioId, { minutos, fecha }) {
  const r = await query('INSERT INTO ocio_ratos (ocio_id, minutos, fecha) VALUES (?, ?, ?)', [ocioId, minutos, fecha]);
  return r.insertId;
}

async function eliminarRato(ocioId, ratoId) {
  const r = await query('DELETE FROM ocio_ratos WHERE id = ? AND ocio_id = ?', [ratoId, ocioId]);
  return r.affectedRows > 0;
}

// Minutos de ocio por día desde una fecha (para el equilibrio en Progreso).
async function minutosPorDia(usuarioId, desde) {
  return query(
    `SELECT DATE(r.fecha) AS dia, SUM(r.minutos) AS minutos
       FROM ocio_ratos r
       JOIN ocio o ON o.id = r.ocio_id
      WHERE o.usuario_id = ? AND r.fecha >= ?
      GROUP BY DATE(r.fecha)`,
    [usuarioId, desde],
  );
}

module.exports = {
  listar,
  buscar,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  ratos,
  crearRato,
  eliminarRato,
  minutosPorDia,
};
