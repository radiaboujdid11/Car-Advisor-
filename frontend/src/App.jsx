import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Cursor from './components/Cursor';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Catalog from './pages/Catalog';
import CarDetail from './pages/CarDetail';
import Comparator from './pages/Comparator';

const HEADER_ROUTES = ['/results', '/cars', '/compare'];

function AppShell({ compareCars, children }) {
  const { pathname } = useLocation();
  const showHeader = HEADER_ROUTES.some(r => pathname === r || pathname.startsWith('/cars/'));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Cursor />
      {showHeader && <Header compareCars={compareCars} />}
      <main style={{ position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [quizResults, setQuizResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carAdvisor_results')) || null; } catch { return null; }
  });
  const [compareCars, setCompareCars] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carAdvisor_compare')) || []; } catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carAdvisor_favorites')) || []; } catch { return []; }
  });

  useEffect(() => {
    if (quizResults) localStorage.setItem('carAdvisor_results', JSON.stringify(quizResults));
  }, [quizResults]);
  useEffect(() => {
    localStorage.setItem('carAdvisor_compare', JSON.stringify(compareCars));
  }, [compareCars]);
  useEffect(() => {
    localStorage.setItem('carAdvisor_favorites', JSON.stringify(favorites));
  }, [favorites]);

  function addToCompare(car) {
    setCompareCars(prev => {
      if (prev.find(c => c.id === car.id)) return prev;
      if (prev.length >= 4) return prev;
      return [...prev, car];
    });
  }
  function removeFromCompare(carId) { setCompareCars(prev => prev.filter(c => c.id !== carId)); }
  function toggleFavorite(car) {
    setFavorites(prev => prev.find(f => f.id === car.id) ? prev.filter(f => f.id !== car.id) : [...prev, car]);
  }
  function isFavorite(carId) { return favorites.some(f => f.id === carId); }

  const shared = { addToCompare, removeFromCompare, toggleFavorite, isFavorite, compareCars };

  return (
    <BrowserRouter>
      <AppShell compareCars={compareCars}>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/quiz"     element={<Quiz onComplete={r => setQuizResults(r)} />} />
          <Route path="/results"  element={quizResults ? <Results results={quizResults} {...shared} /> : <Navigate to="/quiz" replace />} />
          <Route path="/cars"     element={<Catalog {...shared} />} />
          <Route path="/cars/:id" element={<CarDetail {...shared} />} />
          <Route path="/compare"  element={<Comparator cars={compareCars} {...shared} />} />
          <Route path="/search"   element={<Navigate to="/cars" replace />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
