// Limite de débit simple, en mémoire, par adresse IP.
// Limite : chaque instance serverless a sa propre mémoire, donc ce n'est qu'un frein.
// La vraie protection du budget est le plafond de dépenses réglé dans la console Anthropic.

export function createRateLimiter({
  max = 20,
  windowMs = 10 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  const hits = new Map();
  return function allow(key) {
    const t = now();
    const recent = (hits.get(key) || []).filter((ts) => t - ts < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.ceil((windowMs - (t - recent[0])) / 1000) };
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.delete(hits.keys().next().value); // borne la mémoire
    return { ok: true };
  };
}
