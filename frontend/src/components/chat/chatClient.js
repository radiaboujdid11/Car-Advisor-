// Client du flux /api/chat : POST JSON, réponse en Server-Sent Events.

export class ChatHttpError extends Error {
  constructor(status, body) {
    super(body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Les 3 recommandations du dernier quiz (identifiants et scores seulement). */
export function readQuizResults() {
  try {
    const stored = JSON.parse(localStorage.getItem('carAdvisor_results'));
    return (stored?.top3 || []).map((c) => ({ id: c.id, matchScore: c.matchScore }));
  } catch {
    return [];
  }
}

/**
 * Envoie la conversation et appelle onEvent pour chaque événement reçu :
 * { type: 'text' | 'status' | 'turn' | 'retry' | 'done' | 'error', ... }.
 */
export async function streamChat({ messages, quiz, onEvent, signal, endpoint = '/api/chat' }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, quiz }),
    signal,
  });
  if (!res.ok || !res.body) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* corps non JSON */
    }
    throw new ChatHttpError(res.status, body);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch {
          /* ligne incomplète ou invalide : ignorée */
        }
      }
    }
  }
}

/** Message affichable pour une erreur HTTP de l'assistant. */
export function describeHttpError(err) {
  if (err?.name === 'AbortError') return null;
  if (err instanceof ChatHttpError) {
    if (err.status === 503) {
      return "L'assistant IA est en cours d'activation et sera bientôt disponible. En attendant, le quiz et le catalogue vous aident à trouver votre voiture.";
    }
    if (err.status === 429) {
      const min = Math.ceil((err.body?.retryAfterSec || 60) / 60);
      return `Vous avez envoyé beaucoup de messages. Réessayez dans ${min} minute${min > 1 ? 's' : ''}.`;
    }
    if (err.status === 404) return "L'assistant n'est pas disponible dans cette version du site.";
  }
  return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
}
