// Avisos flotantes (por ejemplo, "Logro desbloqueado") disponibles en toda la app.
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';

const AvisoContext = createContext(() => {});

export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);

  const mostrar = useCallback((texto) => {
    clearTimeout(temporizador.current);
    setAviso(texto);
    temporizador.current = setTimeout(() => setAviso(null), 3500);
  }, []);

  return (
    <AvisoContext.Provider value={mostrar}>
      {children}
      {aviso && (
        <div className="aviso" role="status">
          <Trophy size={22} aria-hidden="true" />
          {aviso}
        </div>
      )}
    </AvisoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAviso() {
  return useContext(AvisoContext);
}

// Muestra un aviso por cada logro nuevo que devuelva la API.
// eslint-disable-next-line react-refresh/only-export-components
export function anunciarLogros(mostrar, nuevosLogros = []) {
  if (nuevosLogros.length > 0) {
    mostrar(`Logro desbloqueado: ${nuevosLogros.map((l) => l.nombre).join(', ')}`);
  }
}
