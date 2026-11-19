// POST /api/chat — fonction serverless Vercel de l'assistant.
// Entrée : { messages: [{ role, content }], quiz: [{ id, matchScore }] }
// Sortie : flux SSE (text/event-stream) d'événements JSON, puis { type: 'done' }.
// La clé ANTHROPIC_API_KEY reste côté serveur (variable d'environnement Vercel).

import Anthropic from '@anthropic-ai/sdk';
import { ChatInputError, MODEL, runAgent } from './_lib/agent.js';
import { createRateLimiter } from './_lib/rate-limit.js';

const allow = createRateLimiter({ max: 20, windowMs: 10 * 60 * 1000 });
const MAX_BODY_BYTES = 64 * 1024;

let client;
const getClient = () => (client ??= new Anthropic());

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body; // déjà analysé par Vercel
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY_BYTES) throw new ChatInputError('requête trop volumineuse');
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new ChatInputError('JSON invalide');
  }
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (
    (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'inconnue'
  );
}

/** Message affichable par le visiteur pour une erreur de l'API. */
function friendlyError(err) {
  if (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return "L'assistant est mal configuré pour le moment.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "L'assistant reçoit trop de demandes. Réessayez dans une minute.";
  }
  if (err instanceof Anthropic.APIError && err.status >= 500) {
    return "Le service d'IA est momentanément indisponible. Réessayez dans un instant.";
  }
  return 'Une erreur est survenue. Réessayez dans un instant.';
}

export default async function handler(req, res, { anthropic } = {}) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'methode_non_autorisee' }, { Allow: 'POST' });
  }
  if (!anthropic && !process.env.ANTHROPIC_API_KEY) {
    return json(res, 503, { error: 'assistant_non_configure' });
  }

  const limit = allow(clientIp(req));
  if (!limit.ok) {
    return json(
      res,
      429,
      { error: 'trop_de_messages', retryAfterSec: limit.retryAfterSec },
      { 'Retry-After': String(limit.retryAfterSec) },
    );
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    if (err instanceof ChatInputError) return json(res, 400, { error: err.message });
    throw err;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  const started = Date.now();
  try {
    const usage = await runAgent({
      client: anthropic ?? getClient(),
      history: body.messages,
      quizResults: Array.isArray(body.quiz) ? body.quiz.slice(0, 3) : [],
      send,
    });
    send({ type: 'done' });
    // Journal d'utilisation (visible dans les logs Vercel) : sert à mesurer le coût réel.
    console.log(
      JSON.stringify({ event: 'chat', model: MODEL, ms: Date.now() - started, ...usage }),
    );
  } catch (err) {
    if (err instanceof ChatInputError) {
      send({ type: 'error', message: `Message invalide : ${err.message}.` });
    } else {
      console.error(
        JSON.stringify({ event: 'chat_error', status: err?.status, message: err?.message }),
      );
      send({ type: 'error', message: friendlyError(err) });
    }
  } finally {
    res.end();
  }
}
