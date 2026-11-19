// Tests de la fonction /api/chat avec un faux client Anthropic : aucun appel réel, aucun coût.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import Anthropic from '@anthropic-ai/sdk';
import handler from './chat.js';
import { LIMITS, SYSTEM_PROMPT } from './_lib/agent.js';

/** Faux client : rejoue une liste de réponses ; enregistre les requêtes reçues. */
function fakeClient(script) {
  const requests = [];
  let i = 0;
  return {
    requests,
    beta: {
      messages: {
        stream(params) {
          requests.push(structuredClone(params));
          const step = script[i++];
          const listeners = [];
          return {
            on(event, cb) {
              if (event === 'text') listeners.push(cb);
              return this;
            },
            async finalMessage() {
              if (step instanceof Error) throw step;
              for (const block of step.content) {
                if (block.type === 'text') for (const cb of listeners) cb(block.text);
              }
              return {
                stop_reason: step.stop_reason,
                content: step.content,
                usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 },
              };
            },
          };
        },
      },
    },
  };
}

function fakeReq(body, { method = 'POST', ip = '1.2.3.4' } = {}) {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = method;
  req.headers = { 'x-forwarded-for': ip };
  return req;
}

function fakeRes() {
  const res = { status: 0, headers: {}, chunks: [], ended: false };
  res.writeHead = (status, headers) => Object.assign(res, { status, headers });
  res.write = (c) => res.chunks.push(c);
  res.end = (c) => {
    if (c) res.chunks.push(c);
    res.ended = true;
  };
  res.events = () =>
    res.chunks
      .join('')
      .split('\n\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => JSON.parse(l.slice(6)));
  return res;
}

let ipCounter = 0;
const uniqueIp = () => `10.0.0.${++ipCounter}`;

test('réponse simple : le texte est diffusé puis « done »', async () => {
  const client = fakeClient([
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Bonjour !' }] },
  ]);
  const res = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'user', content: 'Salut' }] }, { ip: uniqueIp() }),
    res,
    {
      anthropic: client,
    },
  );
  assert.equal(res.status, 200);
  assert.match(res.headers['Content-Type'], /text\/event-stream/);
  const events = res.events();
  assert.deepEqual(
    events.filter((e) => e.type === 'text').map((e) => e.text),
    ['Bonjour !'],
  );
  assert.equal(events.at(-1).type, 'done');
  assert.ok(res.ended);

  // Paramètres envoyés à l'API
  const p = client.requests[0];
  assert.equal(p.system, SYSTEM_PROMPT);
  assert.deepEqual(p.cache_control, { type: 'ephemeral' });
  assert.equal(p.output_config.effort, 'low');
  assert.equal(p.max_tokens, LIMITS.maxTokens);
  assert.equal(p.tools.length, 4);
});

test('boucle d’outils : le modèle cherche dans le catalogue puis répond', async () => {
  const client = fakeClient([
    {
      stop_reason: 'tool_use',
      content: [
        { type: 'text', text: 'Je regarde. ' },
        {
          type: 'tool_use',
          id: 'toolu_1',
          name: 'rechercher_voitures',
          input: { marque: 'Dacia', limite: 2 },
        },
      ],
    },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Voici deux Dacia.' }] },
  ]);
  const res = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'user', content: 'Une Dacia ?' }] }, { ip: uniqueIp() }),
    res,
    { anthropic: client },
  );
  const events = res.events();
  assert.ok(events.some((e) => e.type === 'status' && /catalogue/.test(e.text)));
  assert.equal(events.at(-1).type, 'done');

  // Le 2e appel contient la réponse du modèle puis le résultat de l'outil (vraies données).
  const second = client.requests[1].messages;
  assert.equal(second.at(-2).role, 'assistant');
  const toolResult = second.at(-1).content[0];
  assert.equal(toolResult.type, 'tool_result');
  assert.equal(toolResult.tool_use_id, 'toolu_1');
  const data = JSON.parse(toolResult.content);
  assert.ok(data.voitures.every((v) => v.marque === 'Dacia'));
});

test('entrée d’outil invalide : renvoyée au modèle comme erreur (is_error)', async () => {
  const client = fakeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'toolu_x', name: 'fiche_voiture', input: { id: 'abc' } }],
    },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Désolé.' }] },
  ]);
  const res = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'user', content: 'fiche ?' }] }, { ip: uniqueIp() }),
    res,
    {
      anthropic: client,
    },
  );
  const result = client.requests[1].messages.at(-1).content[0];
  assert.equal(result.is_error, true);
});

test('les résultats du quiz envoyés par le navigateur sont relus côté serveur', async () => {
  const client = fakeClient([
    {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 't', name: 'resultats_quiz', input: {} }],
    },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] },
  ]);
  const res = fakeRes();
  await handler(
    fakeReq(
      { messages: [{ role: 'user', content: 'Pourquoi ?' }], quiz: [{ id: 319, matchScore: 91 }] },
      { ip: uniqueIp() },
    ),
    res,
    { anthropic: client },
  );
  const data = JSON.parse(client.requests[1].messages.at(-1).content[0].content);
  assert.equal(data.quiz_fait, true);
  assert.equal(data.recommandations[0].id, 319);
  assert.equal(data.recommandations[0].score_compatibilite, 91);
});

test('refus du modèle : message poli, pas d’exécution d’outil', async () => {
  const client = fakeClient([
    {
      stop_reason: 'refusal',
      content: [{ type: 'tool_use', id: 't', name: 'rechercher_voitures', input: {} }],
    },
  ]);
  const res = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'user', content: '...' }] }, { ip: uniqueIp() }),
    res,
    {
      anthropic: client,
    },
  );
  assert.equal(client.requests.length, 1);
  assert.ok(res.events().some((e) => e.type === 'text' && /ne peux pas/.test(e.text)));
});

test('nombre de tours d’outils plafonné', async () => {
  const loop = {
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 't', name: 'rechercher_voitures', input: {} }],
  };
  const client = fakeClient(Array(20).fill(loop));
  const res = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'user', content: 'boucle' }] }, { ip: uniqueIp() }),
    res,
    {
      anthropic: client,
    },
  );
  assert.equal(client.requests.length, LIMITS.maxToolTurns);
  assert.equal(res.events().at(-1).type, 'done');
});

test('erreur de l’API : message lisible, pas de détail technique', async () => {
  const err = new Anthropic.RateLimitError(429, { type: 'error' }, 'rate limited', new Headers());
  const client = fakeClient([err]);
  const res = fakeRes();
  await handler(fakeReq({ messages: [{ role: 'user', content: 'x' }] }, { ip: uniqueIp() }), res, {
    anthropic: client,
  });
  const last = res.events().at(-1);
  assert.equal(last.type, 'error');
  assert.match(last.message, /trop de demandes/);
});

test('entrées refusées : méthode, conversation invalide, message trop long', async () => {
  const client = fakeClient([]);

  const get = fakeRes();
  await handler(fakeReq({}, { method: 'GET', ip: uniqueIp() }), get, { anthropic: client });
  assert.equal(get.status, 405);

  const bad = fakeRes();
  await handler(
    fakeReq({ messages: [{ role: 'assistant', content: 'x' }] }, { ip: uniqueIp() }),
    bad,
    {
      anthropic: client,
    },
  );
  assert.equal(bad.events().at(-1).type, 'error');

  const long = fakeRes();
  await handler(
    fakeReq(
      { messages: [{ role: 'user', content: 'a'.repeat(LIMITS.maxUserChars + 1) }] },
      { ip: uniqueIp() },
    ),
    long,
    { anthropic: client },
  );
  assert.match(long.events().at(-1).message, /trop long/);
  assert.equal(client.requests.length, 0); // aucun appel payant
});

test('limite de débit : 21e message en 10 minutes refusé (429)', async () => {
  const ip = uniqueIp();
  const ok = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] };
  const client = fakeClient(Array(25).fill(ok));
  let last;
  for (let i = 0; i < 21; i++) {
    last = fakeRes();
    await handler(fakeReq({ messages: [{ role: 'user', content: 'x' }] }, { ip }), last, {
      anthropic: client,
    });
  }
  assert.equal(last.status, 429);
  assert.equal(client.requests.length, 20);
});

test('sans clé API configurée : 503 explicite', async () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const res = fakeRes();
  await handler(fakeReq({ messages: [{ role: 'user', content: 'x' }] }, { ip: uniqueIp() }), res);
  assert.equal(res.status, 503);
  if (saved) process.env.ANTHROPIC_API_KEY = saved;
});
