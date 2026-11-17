import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARS, ALL_MAKES } from '../data/cars';
import { CATEGORY_LABELS, EUR_TO_MAD, categoryLabel, formatPriceMAD } from '../utils/format';

const CATEGORIES = [
  { value: '', label: 'Toutes' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

// Chargement progressif : 24 voitures, puis « Voir plus » (277 cartes d'un coup bloquaient le téléphone).
const PAGE_SIZE = 24;

// 16 px minimum dans les champs : évite le zoom automatique de Safari sur iPhone.
const inputStyle = {
  fontFamily: 'var(--sans)',
  fontSize: '16px',
  color: 'var(--ink)',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--line)',
  borderRadius: 0,
  padding: '8px 0',
  minHeight: '44px',
  width: '100%',
  minWidth: 0,
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: '20px',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%232A1F12' stroke-width='1.5'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 4px center',
};

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--sans)',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ink-soft)',
};

export default function Catalog({ addToCompare }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');
  const [category, setCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const cars = useMemo(() => {
    const q = search.toLowerCase();
    return CARS.filter((car) => {
      if (q && !`${car.make} ${car.model}`.toLowerCase().includes(q)) return false;
      if (make && car.make !== make) return false;
      if (category && car.category !== category) return false;
      if (maxBudget && car.price_eur * EUR_TO_MAD > Number(maxBudget)) return false;
      return true;
    });
  }, [search, make, category, maxBudget]);

  // Nouveau filtre : on repart des 24 premières voitures.
  useEffect(() => setLimit(PAGE_SIZE), [search, make, category, maxBudget]);

  function reset() {
    setSearch('');
    setMake('');
    setCategory('');
    setMaxBudget('');
  }

  return (
    <div
      className="px-4 py-8 sm:px-6 md:px-8 md:py-16"
      style={{ background: 'var(--bg)', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-6 md:mb-12">
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              color: 'var(--ink)',
              lineHeight: 1,
            }}
          >
            Catalogue
          </h1>
        </div>

        {/* Filtres : grille 2×2 sur téléphone, une ligne à partir de 768 px */}
        <div
          role="search"
          className="mb-6 grid grid-cols-2 gap-x-4 gap-y-4 md:mb-12 md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-end md:gap-6"
        >
          <label>
            <span style={labelStyle}>Recherche</span>
            <input
              type="search"
              style={inputStyle}
              placeholder="Modèle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            <span style={labelStyle}>Marque</span>
            <select style={selectStyle} value={make} onChange={(e) => setMake(e.target.value)}>
              <option value="">Toutes</option>
              {ALL_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Catégorie</span>
            <select
              style={selectStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Budget max (DH)</span>
            <input
              style={inputStyle}
              placeholder="ex. 250000"
              type="number"
              inputMode="numeric"
              min="0"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={reset}
            className="col-span-2 inline-flex min-h-[44px] items-center justify-center rounded-full md:col-span-1 md:px-4"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              background: 'none',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-mute)')}
          >
            Réinitialiser
          </button>
        </div>

        <p
          aria-live="polite"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '14px',
            color: 'var(--ink-soft)',
            marginBottom: '1rem',
          }}
        >
          {cars.length} voiture{cars.length > 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--ink-mute)' }}>
            <p
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: '28px',
                color: 'var(--ink)',
                marginBottom: '1rem',
              }}
            >
              Aucun résultat
            </p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '13px' }}>
              Élargissez vos critères de recherche.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: '1.25rem',
              }}
            >
              {cars.slice(0, limit).map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onDetail={() => navigate(`/cars/${car.id}`)}
                  onCompare={() => addToCompare(car)}
                />
              ))}
            </div>
            {limit < cars.length && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                  className="inline-flex min-h-[48px] items-center rounded-full px-8"
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'var(--gold-deep)',
                  }}
                >
                  Voir plus ({Math.min(PAGE_SIZE, cars.length - limit)} sur {cars.length - limit}{' '}
                  restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CarCard({ car, onDetail, onCompare }) {
  const [hovered, setHovered] = useState(false);
  const photo = car.photo_url || car.image || null;

  return (
    <div
      style={{
        background: hovered ? 'var(--bg-3)' : 'var(--bg-2)',
        cursor: 'pointer',
        transition: 'background 0.25s',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      <div
        style={{
          height: '185px',
          background: 'var(--bg-2)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {photo ? (
          <img
            loading="lazy"
            decoding="async"
            src={photo}
            alt={`${car.make} ${car.model}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'transform .5s ease',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #F0F7FF 0%, #222 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: '2.2rem',
                color: 'rgba(255,255,255,.06)',
              }}
            >
              {car.make}
            </span>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: 'linear-gradient(to top, var(--bg-2), transparent)',
          }}
        />
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'rgba(30,58,138,.75)',
              backdropFilter: 'blur(8px)',
              padding: '3px 10px',
              borderRadius: '20px',
            }}
          >
            {categoryLabel(car.category)}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: '20px',
                color: 'var(--ink)',
                lineHeight: 1.1,
              }}
            >
              {car.make} {car.model}
            </h3>
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                color: 'var(--ink-soft)',
                marginTop: '3px',
              }}
            >
              {car.year}
            </p>
          </div>
          <p
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: '16px',
              color: 'var(--gold)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {formatPriceMAD(car.price_eur, 'Sur demande')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--line)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Puissance', value: car.power_hp ? `${car.power_hp} ch` : '—' },
            {
              label: 'Conso.',
              value:
                car.consumption_l100k === 0
                  ? 'Élec.'
                  : car.consumption_l100k
                    ? `${car.consumption_l100k} L`
                    : '—',
            },
            {
              label: 'CO₂',
              value: car.co2_g_km === 0 ? '0 g' : car.co2_g_km ? `${car.co2_g_km} g` : '—',
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{ background: 'var(--bg)', padding: '0.65rem', textAlign: 'center' }}
            >
              <p
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: '12px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: '3px',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDetail}
            style={{
              flex: 1,
              minHeight: '44px',
              fontFamily: 'var(--sans)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              background: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '50px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--ink)';
            }}
          >
            Voir la fiche
          </button>
          <button
            onClick={onCompare}
            aria-label={`Comparer ${car.make} ${car.model}`}
            style={{
              minHeight: '44px',
              fontFamily: 'var(--sans)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              border: '1px solid var(--line)',
              background: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '50px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.color = 'var(--ink-soft)';
            }}
          >
            Comparer
          </button>
        </div>
      </div>
    </div>
  );
}
