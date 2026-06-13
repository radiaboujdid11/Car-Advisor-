import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'eco', label: 'Écologique' },
  { value: 'luxury', label: 'Luxe' },
  { value: 'practical', label: 'Pratique' },
  { value: 'performance', label: 'Performance' },
];

const CAT_LABEL = { eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' };

const inputStyle = {
  fontFamily: 'var(--sans)', fontSize: '12px', letterSpacing: '0.05em',
  color: 'var(--ink-soft)', background: 'var(--bg-2)',
  border: '1px solid var(--line)', padding: '10px 14px',
  outline: 'none', width: '100%',
  transition: 'border-color 0.2s',
};

export default function Catalog({ addToCompare }) {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [makes, setMakes] = useState([]);
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');
  const [category, setCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 120 };
      if (make) params.make = make;
      if (category) params.category = category;
      if (maxBudget) params.max_budget = maxBudget;

      const endpoint = search
        ? `${API}/api/cars/search`
        : `${API}/api/cars`;
      if (search) params.q = search;

      const res = await axios.get(endpoint, { params });
      setCars(res.data.cars || []);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [search, make, category, maxBudget]);

  useEffect(() => {
    if (cars.length > 0) {
      setMakes([...new Set(cars.map(c => c.make))].sort());
    }
  }, [cars]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  function reset() { setSearch(''); setMake(''); setCategory(''); setMaxBudget(''); }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '0.5rem' }}>
            {cars.length} véhicules disponibles
          </p>
          <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(36px, 6vw, 64px)', color: 'var(--ink)', lineHeight: 1 }}>
            Catalogue
          </h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', marginBottom: '3rem' }}>
          <input
            style={inputStyle} placeholder="Rechercher un modèle..."
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
          <select
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={make} onChange={e => setMake(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          >
            <option value="">Toutes les marques</option>
            {makes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={category} onChange={e => setCategory(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input
            style={inputStyle} placeholder="Budget max (€)" type="number"
            value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
          <button
            onClick={reset}
            style={{
              fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--ink-mute)', background: 'var(--bg-2)', border: 'none',
              padding: '10px 14px', cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
          >
            Réinitialiser
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <PulsingDot />
          </div>
        ) : cars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--ink-mute)' }}>
            <p style={{ fontFamily: 'var(--serif-display)', fontSize: '28px', color: 'var(--ink)', marginBottom: '1rem' }}>Aucun résultat</p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '13px' }}>Élargissez vos critères de recherche.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--line)' }}>
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

  const formatPrice = p => p ? `${Math.round(p).toLocaleString('fr-FR')} €` : 'Sur demande';

  return (
    <div
      style={{
        background: hovered ? 'var(--bg-3)' : 'var(--bg-2)',
        padding: '2rem',
        cursor: 'pointer',
        transition: 'background 0.25s',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDetail}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: '6px' }}>
            {CAT_LABEL[car.category] || car.category}
          </p>
          <h3 style={{ fontFamily: 'var(--serif-display)', fontSize: '22px', color: 'var(--ink)', lineHeight: 1.1 }}>
            {car.make} {car.model}
          </h3>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-mute)', marginTop: '4px' }}>
            {car.year}
          </p>
        </div>
        <p style={{ fontFamily: 'var(--serif-display)', fontSize: '18px', color: 'var(--gold)', textAlign: 'right', whiteSpace: 'nowrap' }}>
          {formatPrice(car.price_eur)}
        </p>
      </div>

      {/* Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--line)' }}>
        {[
          { label: 'Puissance', value: car.power_hp ? `${car.power_hp} ch` : '—' },
          { label: 'Conso.', value: car.consumption_l100k === 0 ? 'Électrique' : car.consumption_l100k ? `${car.consumption_l100k} L` : '—' },
          { label: 'CO₂', value: car.co2_g_km === 0 ? '0 g' : car.co2_g_km ? `${car.co2_g_km} g` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg)', padding: '0.75rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onDetail}
          style={{
            flex: 1, fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold-2)', border: '1px solid var(--gold-deep)', background: 'none',
            padding: '8px 12px', cursor: 'pointer', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gold-deep)'}
        >
          Voir la fiche
        </button>
        <button
          onClick={onCompare}
          style={{
            fontFamily: 'var(--sans)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--ink-mute)', border: '1px solid var(--line)', background: 'none',
            padding: '8px 12px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-deep)'; e.currentTarget.style.color = 'var(--gold-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-mute)'; }}
        >
          Comparer
        </button>
      </div>
    </div>
  );
}

function PulsingDot() {
  return (
    <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes lx-ping2 { 0%{transform:scale(1);opacity:.6} 70%,100%{transform:scale(2.2);opacity:0} }
        @keyframes lx-pulse2 { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
      <div style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)', animation: 'lx-ping2 1.4s cubic-bezier(0,0,0.2,1) infinite' }} />
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)', animation: 'lx-pulse2 1.4s ease-in-out infinite', position: 'relative' }} />
    </div>
  );
}
