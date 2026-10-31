// Logo de Kuadri: cuatro cuadritos en verde lima, uno ya marcado. Representa "ir completando la cuadrícula".
export default function Logo({ conTexto = true }) {
  return (
    <>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="5" fill="#FFFFFF" />
        <rect x="22" y="2" width="16" height="16" rx="5" fill="#D6E6A1" />
        <rect x="2" y="22" width="16" height="16" rx="5" fill="#D6E6A1" />
        <rect x="22" y="22" width="16" height="16" rx="5" fill="#B1CB5A" />
        <path d="M25.5 30l3 3 6-6.5" fill="none" stroke="#141414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {conTexto && <span>kuadri</span>}
    </>
  );
}
