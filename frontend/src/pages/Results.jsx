import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CAT_LABEL = { eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' };
const RANK = ['01', '02', '03'];

export default function Results({ results, addToCompare }) {
  const navigate = useNavigate();
  const { top3 = [] } = results;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '5rem 2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at center top, rgba(245,237,216,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(245,237,216,.14)', border: '1px solid rgba(245,237,216,.3)', color: 'var(--gold)', fontSize: '.75rem', letterSpacing: '.12em', textTransform: 'uppercase', padding: '.4rem 1rem', borderRadius: '50px', marginBottom: '1.5rem' }}>
            Analyse complète
          </div>
          <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2.5rem,6vw,5rem)', lineHeight: 1, letterSpacing: '-.04em', marginBottom: '1.5rem' }}>
            Vos recommandations
          </h1>
          <div style={{ width: 40, height: 1, background: 'var(--gold)', margin: '0 auto' }} />
        </div>

        {/* Top 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
          {top3.map((car, i) => (
            <ResultCard key={car.id || i} car={car} rank={RANK[i]} isFirst={i === 0} onDetail={() => navigate(`/cars/${car.id}`)} onCompare={() => addToCompare(car)} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/compare')} className="btn-primary">Comparer les résultats</button>
          <button onClick={() => navigate('/cars')} className="btn-ghost">Explorer le catalogue</button>
          <button onClick={() => navigate('/quiz')} className="btn-secondary">Recommencer</button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ car, rank, isFirst, onDetail, onCompare }) {
  const [hovered, setHovered] = useState(false);
  const formatPrice = p => p ? `${Math.round(p).toLocaleString('fr-FR')} €` : '—';

  return (
    <div
      style={{ background: hovered ? 'var(--bg-3)' : 'var(--bg-2)', padding: '2.5rem', borderRadius: '16px', border: isFirst ? '1px solid rgba(16,12,4,.4)' : '1px solid rgba(245,237,216,.14)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'background .2s, border-color .2s, transform .2s', transform: hovered ? 'translateY(-4px)' : 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      {/* Ghost rank */}
      <span style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--serif-display)', fontSize: 'clamp(60px,10vw,100px)', fontWeight: 800, color: 'var(--gold)', opacity: isFirst ? .08 : .04, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
        {rank}
      </span>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ fontSize: '.72rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.5rem', fontFamily: 'var(--sans)' }}>
            {rank} · {CAT_LABEL[car.category] || car.category}
          </p>
          <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2.2rem)', lineHeight: 1.1, marginBottom: '.4rem' }}>
            {car.make} {car.model}
          </h2>
          <p style={{ fontSize: '.8rem', color: 'var(--ink-mute)' }}>{car.year}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2.5rem,5vw,3.5rem)', color: isFirst ? 'var(--gold)' : 'var(--ink-soft)', lineHeight: 1 }}>
            {car.matchScore || '—'}<span style={{ fontSize: '.4em', color: 'var(--ink-mute)' }}>%</span>
          </p>
          <p style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: '4px' }}>Compatibilité</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: 'clamp(1.1rem,2vw,1.6rem)', color: 'var(--gold-2)' }}>
            {formatPrice(car.price_eur)}
          </p>
          {car.power_hp && <p style={{ fontSize: '.8rem', color: 'var(--ink-mute)', marginTop: '4px' }}>{car.power_hp} ch</p>}
        </div>
      </div>

      {car.matchReason && (
        <p style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: '.88rem', color: 'var(--ink-mute)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          {car.matchReason}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }} onClick={e => e.stopPropagation()}>
        <button onClick={onDetail} className="btn-outline" style={{ fontSize: '.78rem', padding: '.5rem 1.2rem' }}>Voir la fiche</button>
        <button onClick={onCompare} className="btn-secondary" style={{ fontSize: '.78rem', padding: '.5rem 1.2rem' }}>Comparer</button>
      </div>
    </div>
  );
}
