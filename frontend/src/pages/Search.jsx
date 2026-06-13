import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'eco', label: '🌱 Écologique' },
  { value: 'luxury', label: '👑 Luxe' },
  { value: 'practical', label: '🚗 Pratique' },
  { value: 'performance', label: '⚡ Performance' }
];

const CAT_COLORS = {
  eco:         'bg-emerald-100 text-emerald-700',
  luxury:      'bg-purple-100 text-purple-700',
  practical:   'bg-blue-100 text-blue-700',
  performance: 'bg-amber-100 text-amber-700'
};

function CarGrid({ cars, onCompare, onFavorite, isFavorite }) {
  if (cars.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-lg font-medium">Aucune voiture trouvée</p>
        <p className="text-sm mt-1">Essaie des filtres moins restrictifs</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {cars.map(car => (
        <div key={car.id} className="card group animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 flex items-center justify-between">
            <div>
              <span className={`badge text-xs mb-1 ${CAT_COLORS[car.category] || 'bg-gray-100 text-gray-600'}`}>
                {car.category}
              </span>
              <h3 className="font-bold text-white text-lg">{car.make} {car.model}</h3>
              <span className="text-gray-400 text-sm">{car.year}</span>
            </div>
            <span className="text-4xl opacity-80">🚗</span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">Puissance</div>
                <div className="font-bold text-sm">{car.power_hp ? `${car.power_hp} ch` : '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">Conso.</div>
                <div className="font-bold text-sm">{car.consumption_l100k ? `${car.consumption_l100k}L` : '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-400">CO₂</div>
                <div className="font-bold text-sm">{car.co2_g_km !== null && car.co2_g_km !== undefined ? `${car.co2_g_km}g` : '—'}</div>
              </div>
            </div>

            <div className="text-xl font-bold text-blue-600 mb-4">
              {car.price_eur ? `${Math.round(car.price_eur).toLocaleString('fr-FR')} €` : 'Prix sur demande'}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onCompare(car)}
                className="flex-1 text-sm py-2 btn-outline"
              >
                📊 Comparer
              </button>
              <button
                onClick={() => onFavorite(car)}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                  ${isFavorite(car.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-300'}`}
              >
                {isFavorite(car.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Search({ addToCompare, toggleFavorite, isFavorite }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [makes, setMakes] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');
  const [category, setCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (make)      params.make = make;
      if (category)  params.category = category;
      if (maxBudget) params.max_budget = maxBudget;

      if (search) {
        const res = await axios.get(`${API}/api/cars/search`, { params: { ...params, q: search } });
        setCars(res.data.cars || []);
      } else {
        const res = await axios.get(`${API}/api/cars`, { params: { ...params, limit: 120 } });
        setCars(res.data.cars || []);
      }
    } catch (err) {
      setError('Impossible de contacter le serveur. Assure-toi que le backend tourne sur le port 3001.');
    } finally {
      setLoading(false);
    }
  }, [search, make, category, maxBudget]);

  // Extract unique makes from loaded cars
  useEffect(() => {
    if (cars.length > 0) {
      const unique = [...new Set(cars.map(c => c.make))].sort();
      setMakes(unique);
    }
  }, [cars]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">🔍 Explorer les voitures</h1>
        <p className="text-gray-500">{cars.length} voitures disponibles</p>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {/* Make */}
          <select
            value={make}
            onChange={e => setMake(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
          >
            <option value="">Toutes les marques</option>
            {makes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Budget */}
          <input
            type="number"
            placeholder="Budget max (€)"
            value={maxBudget}
            onChange={e => setMaxBudget(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="mt-3 flex gap-2 justify-end">
          <button
            onClick={() => { setSearch(''); setMake(''); setCategory(''); setMaxBudget(''); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition px-3 py-1.5"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Chargement des voitures...</p>
        </div>
      ) : (
        <CarGrid
          cars={cars}
          onCompare={addToCompare}
          onFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}
    </div>
  );
}
