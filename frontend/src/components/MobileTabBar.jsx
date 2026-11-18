import { Link, useLocation } from 'react-router-dom';

// Barre d'onglets fixée en bas de l'écran, à portée de pouce (téléphones uniquement).
// À partir de md (768 px), la navigation est dans l'en-tête.

const icon = {
  catalogue: <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />,
  compare: (
    <>
      <rect x="3.5" y="5" width="7" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="7" height="14" rx="1.5" />
    </>
  ),
  results: (
    <path
      d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
      strokeLinejoin="round"
    />
  ),
  start: <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
};

function Icon({ name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {icon[name]}
    </svg>
  );
}

export default function MobileTabBar({ compareCount = 0 }) {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/cars', label: 'Catalogue', icon: 'catalogue', active: pathname.startsWith('/cars') },
    {
      to: '/compare',
      label: compareCount ? `Comparer (${compareCount})` : 'Comparer',
      icon: 'compare',
      active: pathname === '/compare',
    },
    { to: '/results', label: 'Résultats', icon: 'results', active: pathname === '/results' },
    { to: '/quiz', label: 'Quiz', icon: 'start', active: false, primary: true },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-4 md:hidden"
      style={{
        background: 'rgba(20,14,8,.96)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          aria-current={tab.active ? 'page' : undefined}
          className="flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-center"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '12px',
            fontWeight: tab.active || tab.primary ? 600 : 500,
            color: tab.primary ? '#E4A985' : tab.active ? '#fff' : 'rgba(255,255,255,.72)',
          }}
        >
          <Icon name={tab.icon} />
          <span className="leading-tight">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
