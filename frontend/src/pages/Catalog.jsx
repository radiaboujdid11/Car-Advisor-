import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARS, ALL_MAKES } from '../data/cars';

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'eco', label: 'Écologique' },
  { value: 'luxury', label: 'Luxe' },
  { value: 'practical', label: 'Pratique' },
  { value: 'performance', label: 'Performance' },
];

const CAT_LABEL = { eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' };

const inputStyle = {
  fontFamily: 'var(--sans)', fontSize: '12px', letterSpacing: '0.06em',
  color: 'var(--ink-soft)', background: 'none',
  border: 'none', padding: '10px 0',
  outline: 'none', width: '100%',
};

export default function Catalog({ addToCompare }) {
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [make, setMake]           = useState('');
  const [category, setCategory]   = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const cars = useMemo(() => {
    const q = search.toLowerCase();
    return CARS.filter(car => {
      if (q && !`${car.make} ${car.model}`.toLowerCase().includes(q)) return false;
      if (make && car.make !== make) return false;
      if (category && car.category !== category) return false;
      if (maxBudget && car.price_eur * 10.8 > Number(maxBudget)) return false;
      return true;
    });
  }, [search, make, category, maxBudget]);

  function reset() { setSearch(''); setMake(''); setCategory(''); setMaxBudget(''); }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(36px, 6vw, 64px)', color: 'var(--ink)', lineHeight: 1 }}>
            Catalogue
          </h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            style={inputStyle} placeholder="Rechercher un modèle..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={make} onChange={e => setMake(e.target.value)}
          >
            <option value="">Toutes les marques</option>
            {ALL_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={category} onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input
            style={inputStyle} placeholder="Budget max (DH)" type="number"
            value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
          />
          <button
            onClick={reset}
            style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
          >
            Réinitialiser
          </button>
        </div>



        {/* Grid */}
        {cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--ink-mute)' }}>
            <p style={{ fontFamily: 'var(--serif-display)', fontSize: '28px', color: 'var(--ink)', marginBottom: '1rem' }}>Aucun résultat</p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '13px' }}>Élargissez vos critères de recherche.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {cars.map(car => (
              <CarCard key={car.id} car={car} onDetail={() => navigate(`/cars/${car.id}`)} onCompare={() => addToCompare(car)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CarCard({ car, onDetail, onCompare }) {
  const [hovered, setHovered] = useState(false);
  const photo = car.photo_url || car.image || null;
  const formatPrice = p => p ? `${Math.round(p * 10.8).toLocaleString('fr-FR')} DH` : 'Sur demande';

  return (
    <div
      style={{ background: hovered ? 'var(--bg-3)' : 'var(--bg-2)', cursor: 'pointer', transition: 'background 0.25s', display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      <div style={{ height: '185px', background: 'var(--bg-2)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {photo
          ? <img src={photo} alt={`${car.make} ${car.model}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform .5s ease', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F0F7FF 0%, #222 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--serif-display)', fontSize: '2.2rem', color: 'rgba(255,255,255,.06)' }}>{car.make}</span>
            </div>
        }
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: 'linear-gradient(to top, var(--bg-2), transparent)' }} />
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', background: 'rgba(30,58,138,.6)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: '20px' }}>
            {CAT_LABEL[car.category] || car.category}
          </span>
        </div>
      </div>

      <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--serif-display)', fontSize: '20px', color: 'var(--ink)', lineHeight: 1.1 }}>
              {car.make} {car.model}
            </h3>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--ink-mute)', marginTop: '3px' }}>{car.year}</p>
          </div>
          <p style={{ fontFamily: 'var(--serif-display)', fontSize: '16px', color: 'var(--gold)', textAlign: 'right', whiteSpace: 'nowrap' }}>
            {formatPrice(car.price_eur)}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
          {[
            { label: 'Puissance', value: car.power_hp ? `${car.power_hp} ch` : '—' },
            { label: 'Conso.', value: car.consumption_l100k === 0 ? 'Élec.' : car.consumption_l100k ? `${car.consumption_l100k} L` : '—' },
            { label: 'CO₂', value: car.co2_g_km === 0 ? '0 g' : car.co2_g_km ? `${car.co2_g_km} g` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg)', padding: '0.65rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '3px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)' }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
          <button onClick={onDetail}
            style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink)', border: '1px solid rgba(255,255,255,.15)', background: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '50px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink)'; }}
          >Voir la fiche</button>
          <button onClick={onCompare}
            style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', border: '1px solid rgba(255,255,255,.08)', background: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '50px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'var(--ink-mute)'; }}
          >Comparer</button>
        </div>
      </div>
    </div>
  );
}
