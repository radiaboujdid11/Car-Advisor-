import { useEffect, useState } from 'react';

/** true si la media query correspond ; suit les changements (rotation, redimensionnement). */
export function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Point de rupture « tablette » de Tailwind (md = 768 px). */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');
