// Estudio creativo: paletas de colores, tipografías y plantillas que las combinan.
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/cliente';
import { anunciarLogros, useAviso } from '../components/AvisoContext';
import { Encabezado } from '../components/Layout';
import Modal from '../components/Modal';
import PaletaForm from '../components/PaletaForm';
import TipografiaForm, { USOS } from '../components/TipografiaForm';
import PlantillaForm, { MuestraPlantilla } from '../components/PlantillaForm';
import { colorTexto } from '../utils/color';
import { cargarFuente, familiaCss } from '../utils/fuentes';

const PESTANAS = [
  { clave: 'paletas', texto: 'Paletas', nueva: 'Nueva paleta', editar: 'Editar paleta', ruta: '/estudio/paletas' },
  { clave: 'tipografias', texto: 'Tipografías', nueva: 'Nueva tipografía', editar: 'Editar tipografía', ruta: '/estudio/tipografias' },
  { clave: 'plantillas', texto: 'Plantillas', nueva: 'Nueva plantilla', editar: 'Editar plantilla', ruta: '/estudio/plantillas' },
];

const VACIOS = {
  paletas: 'Aún no tienes paletas. Crea la primera con el botón Nueva.',
  tipografias: 'Guarda aquí las fuentes de Google Fonts que te gustan.',
  plantillas: 'Una plantilla junta una paleta con dos fuentes. Crea paletas y tipografías primero.',
};

function Acciones({ nombre, onEditar, onEliminar }) {
  return (
    <div className="estudio-acciones">
      <button type="button" className="boton boton-icono" onClick={onEditar} aria-label={`Editar "${nombre}"`}>
        <Pencil size={16} />
      </button>
      <button type="button" className="boton boton-icono" onClick={onEliminar} aria-label={`Eliminar "${nombre}"`}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function PaletaTarjeta({ paleta, onCopiar, ...acciones }) {
  return (
    <article className="estudio-tarjeta">
      <div className="paleta-colores">
        {paleta.colores.map((c, i) => (
          <button
            key={`${c}-${i}`}
            type="button"
            style={{ background: c, color: colorTexto(c) }}
            onClick={() => onCopiar(c)}
            aria-label={`Copiar ${c}`}
          >
            <span>{c}</span>
          </button>
        ))}
      </div>
      <div className="estudio-pie">
        <h3>{paleta.nombre}</h3>
        <Acciones nombre={paleta.nombre} {...acciones} />
      </div>
    </article>
  );
}

function TipografiaTarjeta({ tipografia, ...acciones }) {
  useEffect(() => cargarFuente(tipografia.nombre), [tipografia.nombre]);
  const uso = USOS.find((u) => u.valor === tipografia.uso)?.texto;
  return (
    <article className="estudio-tarjeta fuente-tarjeta">
      <span className="fuente-letras" style={{ fontFamily: familiaCss(tipografia.nombre) }} aria-hidden="true">
        Aa
      </span>
      <p className="fuente-muestra" style={{ fontFamily: familiaCss(tipografia.nombre) }}>
        {tipografia.muestra || 'El veloz murciélago hindú comía feliz cardillo y kiwi.'}
      </p>
      <div className="estudio-pie">
        <div>
          <h3>{tipografia.nombre}</h3>
          <span className="chip">{uso}</span>
        </div>
        <Acciones nombre={tipografia.nombre} {...acciones} />
      </div>
    </article>
  );
}

function PlantillaTarjeta({ plantilla, ...acciones }) {
  return (
    <article className="estudio-tarjeta">
      <MuestraPlantilla
        nombre={plantilla.nombre}
        colores={plantilla.colores}
        fuenteTitulos={plantilla.fuente_titulos}
        fuenteTexto={plantilla.fuente_texto}
      />
      <div className="estudio-pie">
        <div style={{ minWidth: 0 }}>
          <h3>{plantilla.nombre}</h3>
          <p className="texto-suave estudio-detalle">
            {[plantilla.paleta_nombre, plantilla.fuente_titulos, plantilla.fuente_texto].filter(Boolean).join(' · ') ||
              'Sin paleta ni fuentes'}
          </p>
          {plantilla.nota && <p className="estudio-detalle">{plantilla.nota}</p>}
        </div>
        <Acciones nombre={plantilla.nombre} {...acciones} />
      </div>
    </article>
  );
}

export default function Estudio() {
  const mostrarAviso = useAviso();
  const [pestana, setPestana] = useState('paletas');
  const [listas, setListas] = useState({ paletas: [], tipografias: [], plantillas: [] });
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo, objeto = editar
  const [error, setError] = useState('');

  const actual = PESTANAS.find((p) => p.clave === pestana);

  const cargar = useCallback(
    () =>
      Promise.all(PESTANAS.map((p) => api.get(p.ruta)))
        .then(([paletas, tipografias, plantillas]) => setListas({ paletas, tipografias, plantillas }))
        .catch((e) => setError(e.message)),
    [],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(datos) {
    const respuesta = editando?.id ? await api.put(`${actual.ruta}/${editando.id}`, datos) : await api.post(actual.ruta, datos);
    // Crear una paleta puede dar el logro "Creativo"
    anunciarLogros(mostrarAviso, respuesta?.nuevosLogros);
    setEditando(null);
    cargar();
  }

  async function eliminar(item) {
    if (!window.confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await api.delete(`${actual.ruta}/${item.id}`);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copiar(color) {
    try {
      await navigator.clipboard.writeText(color);
      mostrarAviso(`Copiaste ${color}`);
    } catch {
      mostrarAviso(`Tu navegador no dejó copiar. El código es ${color}`);
    }
  }

  const lista = listas[pestana];
  const acciones = (item) => ({ onEditar: () => setEditando(item), onEliminar: () => eliminar(item) });

  return (
    <>
      <Encabezado titulo="Estudio" subtitulo="Tus colores, fuentes y combinaciones favoritas.">
        <button type="button" className="boton boton-primario" onClick={() => setEditando({})} aria-label={actual.nueva}>
          <Plus size={20} strokeWidth={3} />
          <span>Nueva</span>
        </button>
      </Encabezado>

      {error && <div className="alerta" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="filtros">
        <div className="pestanas pestanas-desliza" role="group" aria-label="Estudio">
          {PESTANAS.map((p) => (
            <button key={p.clave} type="button" aria-pressed={pestana === p.clave} onClick={() => setPestana(p.clave)}>
              {p.texto} ({listas[p.clave].length})
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="vacio">{VACIOS[pestana]}</p>
      ) : (
        <div className="rejilla-estudio">
          {pestana === 'paletas' && lista.map((p) => <PaletaTarjeta key={p.id} paleta={p} onCopiar={copiar} {...acciones(p)} />)}
          {pestana === 'tipografias' && lista.map((t) => <TipografiaTarjeta key={t.id} tipografia={t} {...acciones(t)} />)}
          {pestana === 'plantillas' && lista.map((p) => <PlantillaTarjeta key={p.id} plantilla={p} {...acciones(p)} />)}
        </div>
      )}

      {editando && (
        <Modal titulo={editando.id ? actual.editar : actual.nueva} onCerrar={() => setEditando(null)}>
          {pestana === 'paletas' && <PaletaForm paleta={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />}
          {pestana === 'tipografias' && (
            <TipografiaForm tipografia={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
          )}
          {pestana === 'plantillas' && (
            <PlantillaForm
              plantilla={editando}
              paletas={listas.paletas}
              tipografias={listas.tipografias}
              onGuardar={guardar}
              onCancelar={() => setEditando(null)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
