import { Link, useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';

export default function Header({ compareCars = [] }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const [hl, setHl] = useState({ left: 0, width: 0, opacity: 0 });

  const links = [
    { to: '/cars', label: 'Catalogue' },
    {
      to: '/compare',
      label: compareCars.length > 0 ? `Comparer (${compareCars.length})` : 'Comparer',
    },
    { to: '/results', label: 'Résultats' },
  ];

  const isActive = (to) => pathname === to || (to === '/cars' && pathname.startsWith('/cars'));

  const moveHl = (e) => {
    const nav = navRef.current;
    if (!nav) return;
    const nr = nav.getBoundingClientRect();
    const er = e.currentTarget.getBoundingClientRect();
    setHl({ left: er.left - nr.left, width: er.width, opacity: 1 });
  };

  const hideHl = () => setHl((h) => ({ ...h, opacity: 0 }));

  return (
    <header
      className="flex h-14 items-center justify-between px-4 sm:px-8 md:h-[68px] lg:px-16"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,.08)',
        backgroundImage:
          'linear-gradient(rgba(4,8,14,.72), rgba(4,8,14,.72)), url("/pexels-photo-2770516.avif")',
        backgroundSize: 'cover',
        backgroundPosition: 'center 60%',
      }}
    >
      <Link
        to="/"
        aria-label="AutoAssist — accueil"
        className="flex min-h-[44px] items-center"
        style={{ gap: '10px' }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-2))',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--serif-display)',
            fontWeight: 800,
            fontSize: '1.3rem',
            letterSpacing: '-.02em',
            color: '#fff',
          }}
        >
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </span>
      </Link>

      {/* Navigation complète à partir de la tablette ; sur téléphone : barre d'onglets en bas (MobileTabBar) */}
      <nav
        ref={navRef}
        onMouseLeave={hideHl}
        aria-label="Navigation principale"
        className="hidden items-center md:flex"
        style={{ gap: '.25rem', position: 'relative' }}
      >
        {/* Sliding highlight pill */}
        <span
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '32px',
            left: hl.left,
            width: hl.width,
            background: 'rgba(255,255,255,.1)',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,.08)',
            opacity: hl.opacity,
            transition:
              'left .32s cubic-bezier(.4,0,.2,1), width .32s cubic-bezier(.4,0,.2,1), opacity .18s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            onMouseEnter={moveHl}
            aria-current={isActive(to) ? 'page' : undefined}
            className="inline-flex min-h-[44px] items-center"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.78rem',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: isActive(to) ? '#fff' : 'rgba(255,255,255,.6)',
              transition: 'color .2s',
              padding: '.45rem 1rem',
              borderRadius: '100px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {label}
          </Link>
        ))}

        <Link
          to="/quiz"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gold-deep)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold-2)';
          }}
          className="inline-flex min-h-[44px] items-center"
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            fontSize: '.75rem',
            background: 'var(--gold-2)',
            color: '#fff',
            padding: '.55rem 1.4rem',
            borderRadius: '50px',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            marginLeft: '1rem',
            transition: 'background .2s',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Commencer →
        </Link>
      </nav>
    </header>
  );
}
