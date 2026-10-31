// Logo de Kuadri: cuatro cuadritos con el degradado de la marca, uno ya marcado. Representa "ir completando la cuadrícula".
export default function Logo({ conTexto = true }) {
  return (
    <>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="kuadri-degradado" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFA586" />
            <stop offset="0.55" stopColor="#B51A2B" />
            <stop offset="1" stopColor="#541A2E" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="16" height="16" rx="5" fill="url(#kuadri-degradado)" />
        <rect x="22" y="2" width="16" height="16" rx="5" fill="url(#kuadri-degradado)" />
        <rect x="2" y="22" width="16" height="16" rx="5" fill="url(#kuadri-degradado)" />
        <rect x="22" y="22" width="16" height="16" rx="5" fill="#FFFFFF" />
        <path d="M25.5 30l3 3 6-6.5" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {conTexto && <span>kuadri</span>}
    </>
  );
}
