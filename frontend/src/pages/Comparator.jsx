import { useNavigate } from 'react-router-dom';
import { categoryLabel, formatPriceMAD } from '../utils/format';

const SPECS = [
  { key: 'price_eur', label: 'Prix', format: (v) => formatPriceMAD(v), lowerIsBetter: true },
  {
    key: 'power_hp',
    label: 'Puissance',
    format: (v) => (v ? `${v} ch` : '—'),
    lowerIsBetter: false,
  },
  {
    key: 'consumption_l100k',
    label: 'Consommation',
    shortLabel: 'Conso.',
    format: (v) => (v === 0 ? 'Électrique' : v ? `${v} L/100` : '—'),
    lowerIsBetter: true,
  },
  {
    key: 'co2_g_km',
    label: 'CO₂',
    format: (v) => (v === 0 ? 'Zéro' : v ? `${v} g/km` : '—'),
    lowerIsBetter: true,
  },
  { key: 'year', label: 'Millésime', format: (v) => v || '—', lowerIsBetter: false },
  {
    key: 'category',
    label: 'Catégorie',
    format: (v) => (v ? categoryLabel(v) : '—'),
    lowerIsBetter: null,
  },
];

function getBestIdx(cars, spec) {
  if (spec.lowerIsBetter === null) return -1;
  const vals = cars.map((c) => (typeof c[spec.key] === 'number' ? c[spec.key] : 0));
  const eligible = vals.filter((v) => v > 0);
  if (!eligible.length) return -1;
  return spec.lowerIsBetter ? vals.indexOf(Math.min(...eligible)) : vals.indexOf(Math.max(...vals));
}

const R = '10px';
const GAP = '5px';

export default function Comparator({ cars = [], removeFromCompare }) {
  const navigate = useNavigate();
  const cols = cars.length;

  if (cols === 0) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 56px)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(28px,5vw,48px)',
            color: 'var(--ink)',
            marginBottom: '1.5rem',
          }}
        >
          Aucune voiture à comparer
        </p>
        <div
          style={{ width: '40px', height: '1px', background: 'var(--gold)', margin: '0 auto 2rem' }}
        />
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '14px',
            color: 'var(--ink-mute)',
            lineHeight: 1.7,
            marginBottom: '3rem',
            maxWidth: '400px',
          }}
        >
          Faites le quiz pour obtenir vos recommandations, ou explorez le catalogue.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/quiz')} style={btnPrimary}>
            Faire le quiz
          </button>
          <button onClick={() => navigate('/cars')} style={btnGhost}>
            Explorer le catalogue
          </button>
        </div>
      </div>
    );
  }

  // Colonne des critères : 104 px sur téléphone, 180 px à partir de 768 px (variable CSS --crit).
  const gridCols = `var(--crit) repeat(${cols}, minmax(140px, 1fr))`;

  return (
    <div
      className="px-4 py-8 md:px-8 md:py-16"
      style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* ── Titre hors grille ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--gold-deep)',
                marginBottom: '0.5rem',
              }}
            >
              {cols} véhicule{cols > 1 ? 's' : ''} sélectionné{cols > 1 ? 's' : ''}
            </p>
            <h1
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(32px,5vw,52px)',
                color: 'var(--ink)',
                lineHeight: 1,
              }}
            >
              Comparateur
            </h1>
          </div>
          <button onClick={() => navigate('/cars')} style={btnGhost}>
            + Ajouter
          </button>
        </div>

        {cols > 1 && (
          <p
            className="mb-2 md:hidden"
            style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink-soft)' }}
          >
            Faites glisser le tableau pour voir les autres voitures →
          </p>
        )}

        {/* ── Grille : défilement horizontal, colonne des critères fixe ── */}
        <div
          className="compare-scroll"
          role="region"
          aria-label="Tableau comparatif"
          tabIndex={0}
          style={{
            background: 'transparent',
            borderRadius: '16px',
            padding: GAP,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ minWidth: `calc(var(--crit) + ${cols * 145}px)` }}>
            {/* Ligne en-tête */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: GAP,
                marginBottom: GAP,
              }}
            >
              <div style={{ ...cellCriteria, justifyContent: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#fff',
                  }}
                >
                  Critère
                </span>
              </div>
              {cars.map((car) => (
                <div key={car.id} style={cellHeader}>
                  <p
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: '12px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--gold-deep)',
                      marginBottom: '4px',
                    }}
                  >
                    {car.year}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--serif-display)',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      lineHeight: 1.2,
                      marginBottom: car.matchScore ? '4px' : '8px',
                    }}
                  >
                    {car.make}
                    <br />
                    {car.model}
                  </p>
                  {car.matchScore && (
                    <p
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: '12px',
                        color: 'var(--gold-deep)',
                        marginBottom: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {car.matchScore}% match
                    </p>
                  )}
                  <button
                    onClick={() => removeFromCompare(car.id)}
                    aria-label={`Retirer ${car.make} ${car.model} du comparateur`}
                    className="inline-flex min-h-[44px] items-center"
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-soft)',
                      border: '1px solid rgba(42,31,18,.2)',
                      background: 'none',
                      padding: '0 14px',
                      cursor: 'pointer',
                      borderRadius: '22px',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--gold)';
                      e.currentTarget.style.borderColor = 'var(--gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--ink-soft)';
                      e.currentTarget.style.borderColor = 'rgba(42,31,18,.2)';
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>

            {/* Lignes de données */}
            {SPECS.map((spec) => {
              const bestIdx = getBestIdx(cars, spec);
              return (
                <div
                  key={spec.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    gap: GAP,
                    marginBottom: GAP,
                  }}
                >
                  <div style={cellCriteria}>
                    <span
                      style={{
                        fontFamily: 'var(--sans)',
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {spec.shortLabel ? (
                        <>
                          <span className="md:hidden" title={spec.label}>
                            {spec.shortLabel}
                          </span>
                          <span className="hidden md:inline">{spec.label}</span>
                        </>
                      ) : (
                        spec.label
                      )}
                    </span>
                  </div>
                  {cars.map((car, colIdx) => {
                    const isBest = colIdx === bestIdx;
                    return (
                      <div
                        key={car.id}
                        style={{
                          ...cellData,
                          background: isBest ? '#FDF3EC' : cellData.background,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--serif-display)',
                            fontSize: '16px',
                            color: isBest ? 'var(--gold)' : 'var(--ink-soft)',
                            fontWeight: isBest ? 700 : 400,
                          }}
                        >
                          {spec.format(car[spec.key])}
                        </span>
                        {isBest && (
                          <span
                            style={{
                              display: 'block',
                              fontFamily: 'var(--sans)',
                              fontSize: '12px',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--gold-deep)',
                              marginTop: '4px',
                              fontWeight: 700,
                            }}
                          >
                            Meilleur
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/results')} style={btnGhost}>
            ← Résultats
          </button>
          <button onClick={() => navigate('/cars')} style={btnGhost}>
            Catalogue
          </button>
        </div>
      </div>
    </div>
  );
}

const cellCriteria = {
  background: 'var(--gold-deep)',
  borderRadius: R,
  padding: '1.1rem .75rem',
  // Reste visible pendant le défilement horizontal
  position: 'sticky',
  left: 0,
  zIndex: 2,
  // Couvre les interstices pour que les colonnes qui défilent ne transparaissent pas
  boxShadow: '0 0 0 5px var(--bg)',
  hyphens: 'auto',
  overflowWrap: 'anywhere',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
};

const cellHeader = {
  background: 'var(--bg-2)',
  borderRadius: R,
  padding: '1.1rem 1rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const cellData = {
  background: 'var(--bg)',
  borderRadius: R,
  padding: '1.1rem 1rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '64px',
};

const btnPrimary = {
  fontFamily: 'var(--sans)',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  background: 'var(--gold)',
  color: '#fff',
  border: 'none',
  padding: '0.85rem 2rem',
  minHeight: '48px',
  cursor: 'pointer',
  borderRadius: '50px',
};

const btnGhost = {
  fontFamily: 'var(--sans)',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
  border: '1px solid rgba(42,31,18,.3)',
  background: 'none',
  padding: '0.85rem 2rem',
  minHeight: '48px',
  cursor: 'pointer',
  borderRadius: '50px',
};
