import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryLabel, formatPriceMAD } from '../utils/format';

const RANK = ['01', '02', '03'];

export default function Results({ results, addToCompare }) {
  const navigate = useNavigate();
  const { top3 = [] } = results;

  useEffect(() => {
    const cards = document.querySelectorAll('[data-result-card]');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(36px)';
      setTimeout(
        () => {
          card.style.transition =
            'opacity .75s cubic-bezier(.4,0,.2,1), transform .75s cubic-bezier(.4,0,.2,1)';
          card.style.opacity = '1';
          card.style.transform = 'none';
        },
        180 + i * 160,
      );
    });
  }, []);

  return (
    <div
      className="px-4 py-10 sm:px-6 md:px-8 md:py-20"
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(700px, 100%)',
          height: '400px',
          background:
            'radial-gradient(ellipse at center top, rgba(240,240,240,.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div className="mb-10 md:mb-20" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.5rem',
              background: 'rgba(240,240,240,.14)',
              border: '1px solid rgba(240,240,240,.3)',
              color: 'var(--gold-deep)',
              fontSize: '.75rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              padding: '.4rem 1rem',
              borderRadius: '50px',
              marginBottom: '1.5rem',
            }}
          >
            Analyse complète
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontWeight: 800,
              fontSize: 'clamp(2.5rem,6vw,5rem)',
              lineHeight: 1,
              letterSpacing: '-.04em',
              marginBottom: '1.5rem',
            }}
          >
            Vos recommandations
          </h1>
          <div style={{ width: 40, height: 1, background: 'var(--gold)', margin: '0 auto' }} />
        </div>

        {/* Top 3 */}
        <div
          className="gap-4 md:gap-6"
          style={{ display: 'flex', flexDirection: 'column', marginBottom: '3rem' }}
        >
          {top3.map((car, i) => (
            <ResultCard
              key={car.id || i}
              car={car}
              rank={RANK[i]}
              isFirst={i === 0}
              onDetail={() => navigate(`/cars/${car.id}`)}
              onCompare={() => addToCompare(car)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <button onClick={() => navigate('/compare')} className="btn-primary min-h-[48px]">
            Comparer les résultats
          </button>
          <button onClick={() => navigate('/cars')} className="btn-ghost min-h-[48px]">
            Explorer le catalogue
          </button>
          <button onClick={() => navigate('/quiz')} className="btn-secondary min-h-[48px]">
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ car, rank, isFirst, onDetail, onCompare }) {
  const [hovered, setHovered] = useState(false);
  const photo = car.photo_url || car.image || null;

  return (
    <div
      data-result-card
      className="p-5 sm:p-7 md:p-10"
      style={{
        background: hovered ? 'var(--bg-3)' : 'var(--bg-2)',
        borderRadius: '16px',
        border: isFirst ? '1px solid rgba(240,235,227,.4)' : '1px solid rgba(240,240,240,.14)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background .2s, border-color .2s, transform .2s',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      {/* Ghost rank */}
      <span
        style={{
          position: 'absolute',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(60px,10vw,100px)',
          fontWeight: 800,
          color: 'var(--gold)',
          opacity: isFirst ? 0.08 : 0.04,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {rank}
      </span>

      <div
        className="gap-x-8 gap-y-4"
        style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        {photo && (
          <div
            className="h-[150px] w-full sm:h-[110px] sm:w-[160px]"
            style={{
              flexShrink: 0,
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'var(--bg)',
            }}
          >
            <img
              src={photo}
              alt={`${car.make} ${car.model}`}
              decoding="async"
              width="320"
              height="220"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 'min(200px, 100%)' }}>
          <p
            style={{
              fontSize: '.75rem',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-deep)',
              marginBottom: '.5rem',
              fontFamily: 'var(--sans)',
            }}
          >
            {rank} · {categoryLabel(car.category)}
          </p>
          <h2
            style={{
              fontFamily: 'var(--serif-display)',
              fontWeight: 800,
              fontSize: 'clamp(1.4rem,3vw,2.2rem)',
              lineHeight: 1.1,
              marginBottom: '.4rem',
            }}
          >
            {car.make} {car.model}
          </h2>
          <p style={{ fontSize: '.875rem', color: 'var(--ink-soft)' }}>{car.year}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--serif-display)',
              fontWeight: 800,
              fontSize: 'clamp(2.5rem,5vw,3.5rem)',
              color: isFirst ? 'var(--gold)' : 'var(--ink-soft)',
              lineHeight: 1,
            }}
          >
            {car.matchScore || '—'}
            <span style={{ fontSize: '.4em', color: 'var(--ink-mute)' }}>%</span>
          </p>
          <p
            style={{
              fontSize: '.75rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              marginTop: '4px',
            }}
          >
            Compatibilité
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontFamily: 'var(--serif-display)',
              fontWeight: 700,
              fontSize: 'clamp(1.1rem,2vw,1.6rem)',
              color: 'var(--gold-2)',
            }}
          >
            {formatPriceMAD(car.price_eur)}
          </p>
          {car.power_hp && (
            <p style={{ fontSize: '.875rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
              {car.power_hp} ch
            </p>
          )}
        </div>
      </div>

      {car.matchReason && (
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.8125rem',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            lineHeight: 1.8,
            borderTop: '1px solid var(--line)',
            paddingTop: '1.25rem',
            marginTop: '1.5rem',
          }}
        >
          {car.matchReason}
        </p>
      )}

      <div
        style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDetail}
          className="btn-outline min-h-[44px] flex-1 whitespace-nowrap sm:flex-none"
          style={{ fontSize: '.8125rem', padding: '.5rem 1.2rem' }}
        >
          Voir la fiche
        </button>
        <button
          onClick={onCompare}
          aria-label={`Ajouter ${car.make} ${car.model} au comparateur`}
          className="btn-secondary min-h-[44px] flex-1 whitespace-nowrap sm:flex-none"
          style={{ fontSize: '.8125rem', padding: '.5rem 1.2rem' }}
        >
          Comparer
        </button>
      </div>
    </div>
  );
}
