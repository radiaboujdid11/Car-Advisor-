import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CARS } from '../data/cars';

const CAT_LABEL = { eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' };

export default function CarDetail({ addToCompare }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const car = useMemo(() => CARS.find(c => c.id === Number(id)) || null, [id]);
  const similar = useMemo(() => {
    if (!car) return [];
    return CARS
      .filter(c => c.category === car.category && c.id !== car.id)
      .sort((a, b) => Math.abs(a.price_eur - car.price_eur) - Math.abs(b.price_eur - car.price_eur))
      .slice(0, 4);
  }, [car]);

  function handleCompare() {
    if (car) { addToCompare(car); setAdded(true); }
  }

  if (!car) { navigate('/cars'); return null; }

  const formatPrice = p => p ? `${Math.round(p * 10.8).toLocaleString('fr-FR')} DH` : 'Prix sur demande';
  const isElectric = car.consumption_l100k === 0 || car.co2_g_km === 0;

  const SPECS = [
    { label: 'Puissance', value: car.power_hp ? `${car.power_hp} ch` : '—' },
    { label: 'Consommation', value: isElectric ? '100 % électrique' : car.consumption_l100k ? `${car.consumption_l100k} L / 100 km` : '—' },
    { label: 'Émissions CO₂', value: isElectric ? 'Zéro émission' : car.co2_g_km ? `${car.co2_g_km} g / km` : '—' },
    { label: 'Année', value: car.year || '—' },
    { label: 'Catégorie', value: CAT_LABEL[car.category] || car.category },
    { label: 'Prix', value: formatPrice(car.price_eur) },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Back */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '1rem 2rem' }}>
        <button
          onClick={() => navigate('/cars')}
          style={{
            fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--ink-mute)', background: 'none',
            border: 'none', cursor: 'pointer', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
        >
          ← Retour au catalogue
        </button>
      </div>

      {/* Car image hero */}
      {car.image && (
        <div style={{ width: '100%', height: 'clamp(260px, 40vh, 480px)', position: 'relative', overflow: 'hidden', background: '#111' }}>
          <img src={car.image} alt={`${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d 0%, transparent 50%)' }} />
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>

        {/* Hero header */}
        <div style={{ position: 'relative', marginBottom: '4rem' }}>
          {/* Decorative make name */}
          <span style={{
            position: 'absolute', top: '-20px', left: '-10px',
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(60px, 12vw, 120px)',
            color: 'var(--gold)', opacity: 0.04,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {car.make}
          </span>

          <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '0.75rem', position: 'relative' }}>
            {CAT_LABEL[car.category]} · {car.year}
          </p>
          <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(40px, 7vw, 72px)', color: 'var(--ink)', lineHeight: 1, position: 'relative' }}>
            {car.make}<br />
            <span style={{ color: 'var(--gold)' }}>{car.model}</span>
          </h1>

          <div style={{ width: '40px', height: '1px', background: 'var(--gold)', margin: '2rem 0' }} />

          <p style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--gold-2)', fontStyle: 'italic' }}>
            {formatPrice(car.price_eur)}
          </p>
        </div>

        {/* Specs grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'var(--line)', marginBottom: '4rem' }}>
          {SPECS.map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg-2)', padding: '1.5rem 2rem' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '8px' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--serif-display)', fontSize: '20px', color: 'var(--ink)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Description */}
        {car.description && (
          <div style={{ borderLeft: '1px solid var(--gold-deep)', paddingLeft: '2rem', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: '18px', color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              {car.description}
            </p>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '5rem' }}>
          <button
            onClick={handleCompare}
            disabled={added}
            style={{
              fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
              background: added ? 'transparent' : 'linear-gradient(180deg, var(--gold-2), var(--gold) 60%, var(--gold-deep))',
              color: added ? 'var(--gold)' : '#1a1410',
              border: `1px solid ${added ? 'var(--gold-deep)' : 'var(--gold)'}`,
              padding: '1rem 2rem', cursor: added ? 'default' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {added ? 'Ajouté au comparateur' : 'Ajouter au comparateur'}
          </button>
          <button
            onClick={() => navigate('/quiz')}
            style={{
              fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'var(--gold-2)', border: '1px solid var(--gold-deep)', background: 'none',
              padding: '1rem 2rem', cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,169,110,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gold-deep)'; e.currentTarget.style.background = 'none'; }}
          >
            Refaire le quiz
          </button>
        </div>

        {/* Similar cars */}
        {similar.length > 0 && (
          <div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '3rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '0.5rem' }}>
                Dans la même catégorie
              </p>
              <h2 style={{ fontFamily: 'var(--serif-display)', fontSize: '32px', color: 'var(--ink)' }}>
                Véhicules similaires
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1px', background: 'var(--line)' }}>
              {similar.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/cars/${s.id}`)}
                  style={{
                    background: 'var(--bg-2)', padding: '1.5rem', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-2)'}
                >
                  <p style={{ fontFamily: 'var(--serif-display)', fontSize: '18px', color: 'var(--ink)', marginBottom: '4px' }}>
                    {s.make} {s.model}
                  </p>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--ink-mute)', marginBottom: '8px' }}>{s.year}</p>
                  <p style={{ fontFamily: 'var(--serif-display)', fontSize: '16px', color: 'var(--gold)' }}>
                    {s.price_eur ? `${Math.round(s.price_eur * 10.8).toLocaleString('fr-FR')} DH` : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

