import { useNavigate } from 'react-router-dom';

const SPECS = [
  { key: 'price_eur',         label: 'Prix',         format: v => v ? `${Math.round(v * 10.8).toLocaleString('fr-FR')} DH` : '—', lowerIsBetter: true },
  { key: 'power_hp',          label: 'Puissance',    format: v => v ? `${v} ch` : '—',                                              lowerIsBetter: false },
  { key: 'consumption_l100k', label: 'Consommation', format: v => v === 0 ? 'Électrique' : v ? `${v} L/100` : '—',                  lowerIsBetter: true },
  { key: 'co2_g_km',          label: 'CO₂',          format: v => v === 0 ? 'Zéro' : v ? `${v} g/km` : '—',                        lowerIsBetter: true },
  { key: 'year',              label: 'Millésime',    format: v => v || '—',                                                          lowerIsBetter: false },
  { key: 'category',          label: 'Catégorie',    format: v => ({ eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' }[v] || v), lowerIsBetter: null },
];

const COL_LEFT = '#B8C4A0';   /* olive sage — colonne critères */
const COL_CELL = '#FDFAF6';   /* blanc crème — cellules valeurs */
const COL_HEAD = '#F5EFE3';   /* crème — ligne en-tête voitures */

function getBestIdx(cars, spec) {
  if (spec.lowerIsBetter === null) return -1;
  const vals = cars.map(c => {
    const v = c[spec.key];
    return typeof v === 'number' ? v : 0;
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
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(28px,5vw,48px)', color: 'var(--ink)', marginBottom: '1.5rem' }}>
          Aucune voiture à comparer
        </p>
        <div style={{ width: '40px', height: '1px', background: 'var(--gold)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--ink-mute)', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '400px' }}>
          Faites le quiz pour obtenir vos recommandations, ou explorez le catalogue et cliquez sur "Comparer".
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/quiz')} style={btnPrimary}>Faire le quiz</button>
          <button onClick={() => navigate('/cars')} style={btnGhost}>Explorer le catalogue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              {cars.length} véhicule{cars.length > 1 ? 's' : ''} sélectionné{cars.length > 1 ? 's' : ''}
            </p>
            <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(32px,5vw,56px)', color: 'var(--ink)', lineHeight: 1 }}>
              Comparateur
            </h1>
          </div>
          <button onClick={() => navigate('/cars')} style={btnGhost}>+ Ajouter une voiture</button>
        </div>

        {/* ── Comparison Chart ── */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1.5px solid rgba(42,31,18,.12)', boxShadow: '0 4px 32px rgba(42,31,18,.06)' }}>
          <table style={{ width: '100%', minWidth: `${200 + cars.length * 200}px`, borderCollapse: 'collapse', borderRadius: '16px', overflow: 'hidden' }}>

            {/* ── Car header row ── */}
            <thead>
              <tr style={{ background: COL_HEAD }}>
                {/* Top-left: TABLEAU DE BORD label */}
                <th style={{ width: '180px', padding: '1.6rem 1.4rem', textAlign: 'left', borderRight: '1px solid rgba(42,31,18,.1)' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
                    Critère
                  </span>
                </th>
                {cars.map(car => (
                  <th key={car.id} style={{ padding: '1.6rem 1.2rem', textAlign: 'center', borderLeft: '1px solid rgba(42,31,18,.1)' }}>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '5px' }}>
                      {car.year}
                    </p>
                    <p style={{ fontFamily: 'var(--serif-display)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: car.matchScore ? '4px' : '10px' }}>
                      {car.make}<br />{car.model}
                    </p>
                    {car.matchScore && (
                      <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--gold)', marginBottom: '8px', fontWeight: 600 }}>
                        {car.matchScore}% match
                      </p>
                    )}
                    <button
                      onClick={() => removeFromCompare(car.id)}
                      style={{ fontFamily: 'var(--sans)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', border: '1px solid rgba(42,31,18,.2)', background: 'none', padding: '4px 12px', cursor: 'pointer', borderRadius: '20px', transition: 'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-mute)'; e.currentTarget.style.borderColor = 'rgba(42,31,18,.2)'; }}
                    >
                      Retirer
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Spec rows ── */}
            <tbody>
              {SPECS.map((spec, rowIdx) => {
                const bestIdx = getBestIdx(cars, spec);
                const isAlt = rowIdx % 2 === 0;
                return (
                  <tr key={spec.key}>
                    {/* Left criterion column */}
                    <td style={{ background: COL_LEFT, padding: '1.2rem 1.4rem', borderTop: '1px solid rgba(255,255,255,.3)', borderRight: '1px solid rgba(255,255,255,.3)' }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2A1F12', fontWeight: 700 }}>
                        {spec.label}
                      </span>
                    </td>
                    {/* Value cells */}
                    {cars.map((car, colIdx) => {
                      const isBest = colIdx === bestIdx;
                      return (
                        <td key={car.id} style={{ background: isAlt ? COL_CELL : '#F0E9DE', padding: '1.2rem 1rem', textAlign: 'center', borderTop: '1px solid rgba(42,31,18,.07)', borderLeft: '1px solid rgba(42,31,18,.08)' }}>
                          <span style={{ fontFamily: 'var(--serif-body)', fontSize: '17px', color: isBest ? 'var(--gold)' : 'var(--ink-soft)', fontWeight: isBest ? 600 : 400 }}>
                            {spec.format(car[spec.key])}
                          </span>
                          {isBest && (
                            <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-2)', marginTop: '4px', fontWeight: 700 }}>
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

        {/* ── Footer ── */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/results')} style={btnGhost}>← Retour aux résultats</button>
          <button onClick={() => navigate('/cars')} style={btnGhost}>Explorer le catalogue</button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
  background: 'var(--gold)', color: '#fff', border: 'none', padding: '0.85rem 2rem', cursor: 'pointer', borderRadius: '50px',
};

const btnGhost = {
  fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
  color: 'var(--ink)', border: '1px solid rgba(42,31,18,.3)', background: 'none', padding: '0.85rem 2rem', cursor: 'pointer', borderRadius: '50px',
  transition: 'border-color .2s',
};
