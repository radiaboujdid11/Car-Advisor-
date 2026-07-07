import { Link, useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';

export default function Header({ compareCars = [] }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const [hl, setHl] = useState({ left: 0, width: 0, opacity: 0 });

  const links = [
    { to: '/cars',    label: 'Catalogue' },
    { to: '/compare', label: compareCars.length > 0 ? `Comparer (${compareCars.length})` : 'Comparer' },
    { to: '/results', label: 'Résultats' },
  ];

  const isActive = to => pathname === to || (to === '/cars' && pathname.startsWith('/cars'));

  const moveHl = e => {
    const nav = navRef.current;
    if (!nav) return;
    const nr = nav.getBoundingClientRect();
    const er = e.currentTarget.getBoundingClientRect();
    setHl({ left: er.left - nr.left, width: er.width, opacity: 1 });
  };

  const hideHl = () => setHl(h => ({ ...h, opacity: 0 }));

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4rem', height: '68px',
      borderBottom: '1px solid rgba(240,240,240,.1)',
      background: 'rgba(240,235,227,.92)',
      backdropFilter: 'blur(20px)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-2))',
          display: 'inline-block', flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.02em', color: 'var(--ink)' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </span>
      </Link>

      <nav ref={navRef} onMouseLeave={hideHl}
        style={{ display: 'flex', alignItems: 'center', gap: '.25rem', position: 'relative' }}>

        {/* Sliding highlight pill */}
        <span style={{
          position: 'absolute',
          top: '50%', transform: 'translateY(-50%)',
          height: '32px',
          left: hl.left,
          width: hl.width,
          background: 'rgba(42,31,18,.07)',
          borderRadius: '100px',
          border: '1px solid rgba(42,31,18,.06)',
          opacity: hl.opacity,
          transition: 'left .32s cubic-bezier(.4,0,.2,1), width .32s cubic-bezier(.4,0,.2,1), opacity .18s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {links.map(({ to, label }) => (
          <Link key={to} to={to}
            onMouseEnter={moveHl}
            style={{
              fontFamily: 'var(--sans)', fontSize: '.78rem', letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: isActive(to) ? 'var(--ink)' : 'var(--ink-mute)',
              transition: 'color .2s',
              padding: '.45rem 1rem',
              borderRadius: '100px',
              position: 'relative', zIndex: 1,
            }}
          >
            {label}
          </Link>
        ))}

        <Link to="/quiz"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; }}
          style={{
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.75rem',
            background: 'var(--gold)', color: 'var(--bg)',
            padding: '.55rem 1.4rem', borderRadius: '50px',
            letterSpacing: '.06em', textTransform: 'uppercase',
            display: 'inline-block', marginLeft: '1rem',
            transition: 'background .2s',
            position: 'relative', zIndex: 1,
          }}
        >
          Commencer →
        </Link>
      </nav>
    </header>
  );
}
