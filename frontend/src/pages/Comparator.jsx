import { useNavigate } from 'react-router-dom';

const SPECS = [
  { key: 'price_eur',         label: 'Prix',        format: v => v ? `${Math.round(v).toLocaleString('fr-FR')} €` : '—', lowerIsBetter: true },
  { key: 'power_hp',          label: 'Puissance',   format: v => v ? `${v} ch` : '—',                                     lowerIsBetter: false },
  { key: 'consumption_l100k', label: 'Consommation',format: v => v === 0 ? 'Électrique' : v ? `${v} L/100` : '—',         lowerIsBetter: true },
  { key: 'co2_g_km',          label: 'CO₂',         format: v => v === 0 ? 'Zéro' : v ? `${v} g/km` : '—',               lowerIsBetter: true },
  { key: 'year',              label: 'Millésime',   format: v => v || '—',                                                 lowerIsBetter: false },
  { key: 'category',          label: 'Catégorie',   format: v => ({ eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' }[v] || v), lowerIsBetter: null },
];

function getBestIdx(cars, spec) {
  if (spec.lowerIsBetter === null) return -1;
  const vals = cars.map(c => {
    const v = c[spec.key];
    return (typeof v === 'number') ? v : 0;
  });
  const eligible = vals.filter(v => v > 0);
  if (!eligible.length) return -1;
  return spec.lowerIsBetter
    ? vals.indexOf(Math.min(...eligible))
    : vals.indexOf(Math.max(...vals));
}

export default function Comparator({ cars = [], removeFromCompare }) {
  const navigate = useNavigate();

  if (cars.length === 0) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--ink)', marginBottom: '1.5rem' }}>
          Aucune voiture à comparer
        </p>
        <div style={{ width: '40px', height: '1px', background: 'var(--gold-deep)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--ink-mute)', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '400px', fontWeight: 300 }}>
          Faites le quiz pour obtenir vos recommandations, ou explorez le catalogue et cliquez sur "Comparer".
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <GoldBtn onClick={() => navigate('/quiz')}>Faire le quiz</GoldBtn>
          <GhostBtn onClick={() => navigate('/cars')}>Explorer le catalogue</GhostBtn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '0.5rem' }}>
              {cars.length} véhicule{cars.length > 1 ? 's' : ''} sélectionné{cars.length > 1 ? 's' : ''}
            </p>
            <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--ink)', lineHeight: 1 }}>
              Comparateur
            </h1>
          </div>
          <GhostBtn onClick={() => navigate('/cars')}>+ Ajouter une voiture</GhostBtn>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: `${200 + cars.length * 180}px`, borderCollapse: 'collapse' }}>
            {/* Car headers */}
            <thead>
              <tr>
                <th style={{ padding: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--line)', width: '180px' }} />
                {cars.map(car => (
                  <th key={car.id} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)' }}>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '6px' }}>
                      {car.year}
                    </p>
                    <p style={{ fontFamily: 'var(--serif-display)', fontSize: '20px', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '8px' }}>
                      {car.make}<br />{car.model}
                    </p>
                    {car.matchScore && (
                      <p style={{ fontFamily: 'var(--serif-display)', fontSize: '14px', color: 'var(--gold)', marginBottom: '8px' }}>
                        {car.matchScore}% match
                      </p>
                    )}
                    <button
                      onClick={() => removeFromCompare(car.id)}
                      style={{
                        fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'var(--ink-mute)', border: '1px solid var(--line)', background: 'none',
                        padding: '4px 10px', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold-deep)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-mute)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                    >
                      Retirer
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SPECS.map((spec, rowIdx) => {
                const bestIdx = getBestIdx(cars, spec);
                return (
                  <tr key={spec.key} style={{ background: rowIdx % 2 === 0 ? 'var(--bg-2)' : 'var(--bg)' }}>
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)' }}>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
                        {spec.label}
                      </p>
                    </td>
                    {cars.map((car, colIdx) => {
                      const isBest = colIdx === bestIdx;
                      return (
                        <td key={car.id} style={{
                          padding: '1.25rem 1.5rem', textAlign: 'center',
                          borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)',
                        }}>
                          <span style={{
                            fontFamily: 'var(--serif-display)', fontSize: '18px',
                            color: isBest ? 'var(--gold)' : 'var(--ink-soft)',
                          }}>
                            {spec.format(car[spec.key])}
                          </span>
                          {isBest && (
                            <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginTop: '4px' }}>
                              Meilleur
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          <GhostBtn onClick={() => navigate('/results')}>← Retour aux résultats</GhostBtn>
        </div>
      </div>
    </div>
  );
}

function GoldBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
      background: 'linear-gradient(180deg, var(--gold-2), var(--gold) 60%, var(--gold-deep))',
      color: '#1a1410', border: '1px solid var(--gold)', padding: '0.875rem 2rem', cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
      color: 'var(--gold-2)', border: '1px solid var(--gold-deep)', background: 'none',
      padding: '0.875rem 2rem', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,169,110,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gold-deep)'; e.currentTarget.style.background = 'none'; }}
    >
      {children}
    </button>
  );
}
