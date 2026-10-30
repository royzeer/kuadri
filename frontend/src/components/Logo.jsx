// Logo de Kuadri: cuatro cuadritos, uno ya marcado. Representa "ir completando la cuadrícula".
export default function Logo({ conTexto = true }) {
  return (
    <>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="4" fill="#3359FF" stroke="#161616" strokeWidth="2.5" />
        <rect x="22" y="2" width="16" height="16" rx="4" fill="#FF7438" stroke="#161616" strokeWidth="2.5" />
        <rect x="2" y="22" width="16" height="16" rx="4" fill="#46D9A0" stroke="#161616" strokeWidth="2.5" />
        <rect x="22" y="22" width="16" height="16" rx="4" fill="#EEFF5C" stroke="#161616" strokeWidth="2.5" />
        <path d="M25.5 30l3 3 6-6.5" fill="none" stroke="#161616" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {conTexto && <span>kuadri</span>}
    </>
  );
}
