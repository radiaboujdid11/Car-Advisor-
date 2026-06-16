import { Link, useLocation } from 'react-router-dom';

export default function Header({ compareCars = [] }) {
  const { pathname } = useLocation();

  const links = [
    { to: '/cars',    label: 'Catalogue' },
    { to: '/compare', label: compareCars.length > 0 ? `Comparer (${compareCars.length})` : 'Comparer' },
    { to: '/results', label: 'Résultats' },
  ];

  const isActive = to => pathname === to || (to === '/cars' && pathname.startsWith('/cars'));

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4rem', height: '68px',
      borderBottom: '1px solid rgba(240,240,240,.1)',
      background: 'rgba(13,13,13,.92)',
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

      <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} style={{
            fontFamily: 'var(--sans)', fontSize: '.88rem', letterSpacing: '.04em',
            textTransform: 'uppercase', color: isActive(to) ? 'var(--ink)' : 'var(--ink-mute)',
            transition: 'color .2s',
          }}
          onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--ink-mute)'; }}
          >
            {label}
          </Link>
        ))}
        <Link to="/quiz" style={{
          fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '.88rem',
          background: 'var(--gold)', color: 'var(--bg)',
          padding: '.6rem 1.5rem', borderRadius: '50px',
          letterSpacing: '.02em', transition: 'all .2s',
          display: 'inline-block',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-2)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Commencer →
        </Link>
      </nav>
    </header>
  );
}
