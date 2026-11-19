// Boucle de l'agent : appelle Claude en streaming, exécute les outils du catalogue,
// renvoie les morceaux de texte au navigateur au fur et à mesure (callback `send`).

import Anthropic from '@anthropic-ai/sdk';
import { TOOL_DEFINITIONS, runTool } from './catalog-tools.js';

// Modèle par défaut. Pour réduire le coût (environ 20 fois moins cher), mettre
// ASSISTANT_MODEL=claude-haiku-5-5 dans les variables d'environnement Vercel.
export const MODEL = process.env.ASSISTANT_MODEL || 'claude-opus-5-5';

// Si le modèle refuse une demande (filtres de sécurité), l'API relance automatiquement
// la même requête sur un modèle de repli adapté.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const SUPPORTS_FALLBACKS = /^claude-(opus-5-5|opus-5|sonnet-5-5|fable-5-[12])$/.test(MODEL);

export const LIMITS = {
  maxToolTurns: 6, // appels d'outils enchaînés par question
  maxTokens: 8000, // par réponse du modèle (coût plafonné pour un site public)
  maxHistory: 20, // messages conservés dans la conversation
  maxUserChars: 800,
  maxAssistantChars: 6000,
};

// Prompt système figé (aucune date ni valeur variable) : il reste dans le cache.
export const SYSTEM_PROMPT = `Tu es l'assistant d'AutoAssist, un site qui aide les visiteurs à choisir une voiture sur le marché marocain.

Ce que tu fais :
- Aider à trouver une voiture selon le budget, l'usage, la famille, la motorisation.
- Comparer des modèles du catalogue.
- Expliquer les recommandations du quiz du visiteur.

Règles :
- Les faits (prix, puissance, consommation, modèles disponibles) viennent UNIQUEMENT des outils. N'invente jamais un prix, un modèle ou une caractéristique ; si un outil ne renvoie rien, dis-le.
- Les prix sont en dirhams (DH), relevés entre mai et juillet 2026 : précise qu'ils sont indicatifs et à confirmer en concession quand le visiteur s'apprête à décider.
- Quand tu cites une voiture du catalogue, mets un lien vers sa fiche au format Markdown [Marque Modèle](/cars/ID).
- Le quiz du site utilise un moteur bayésien : il pose 15 à 25 questions et calcule la probabilité de chaque voiture. Le score de compatibilité est une valeur d'affichage dérivée de cette probabilité, pas un pourcentage de certitude.
- Réponds en français, de façon chaleureuse et concise (le visiteur lit souvent sur téléphone) : quelques phrases ou une courte liste. Si le visiteur écrit dans une autre langue, réponds dans sa langue.
- Pose une question de précision si la demande est trop vague (budget ? nombre de places ? ville ou route ?).
- Hors sujet (autre chose que les voitures et ce site) : réponds poliment que tu es spécialisé dans le choix d'une voiture.
- Tu ne donnes pas de conseil financier, juridique ou d'assurance engageant ; oriente vers un professionnel.`;

export class ChatInputError extends Error {}

/** Valide l'historique envoyé par le navigateur : [{ role, content: string }, ...]. */
export function validateHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    throw new ChatInputError('conversation vide');
  }
  const recent = history.slice(-LIMITS.maxHistory);
  // L'API exige que la conversation commence par un message du visiteur.
  while (recent.length && recent[0]?.role !== 'user') recent.shift();
  if (recent.length === 0) throw new ChatInputError('conversation invalide');

  const messages = recent.map((m, i) => {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      throw new ChatInputError(`message ${i} invalide`);
    }
    const max = m.role === 'user' ? LIMITS.maxUserChars : LIMITS.maxAssistantChars;
    const content = m.content.trim().slice(0, max);
    if (!content) throw new ChatInputError(`message ${i} vide`);
    return { role: m.role, content };
  });
  if (messages.at(-1).role !== 'user')
    throw new ChatInputError('le dernier message doit venir du visiteur');
  if (history.at(-1).content.trim().length > LIMITS.maxUserChars) {
    throw new ChatInputError(`message trop long (${LIMITS.maxUserChars} caractères au plus)`);
  }
  return messages;
}

const TOOL_LABELS = {
  rechercher_voitures: 'Recherche dans le catalogue…',
  fiche_voiture: 'Lecture de la fiche…',
  comparer_voitures: 'Comparaison en cours…',
  resultats_quiz: 'Lecture de vos résultats…',
};

/**
 * Fait répondre l'assistant. `send(event)` reçoit :
 *   { type: 'text', text }   morceau de réponse
 *   { type: 'status', text } étape en cours (appel d'outil)
 *   { type: 'turn' }         début d'un appel au modèle
 *   { type: 'retry' }        le dernier appel est relancé : effacer son texte partiel
 * Renvoie le bilan d'utilisation des tokens (pour les journaux).
 */
export async function runAgent({ client, history, quizResults, send }) {
  const messages = validateHistory(history);
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, requests: 0, tools: [] };
  let retries = 0;

  for (let turn = 0; turn < LIMITS.maxToolTurns;) {
    send({ type: 'turn' });
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: LIMITS.maxTokens,
      // Effort bas : conversation simple, réponses rapides et moins de tokens.
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      // Cache automatique du préfixe (outils + système + historique).
      cache_control: { type: 'ephemeral' },
      ...(SUPPORTS_FALLBACKS ? { betas: [FALLBACK_BETA], fallbacks: 'default' } : {}),
      messages,
    });
    stream.on('text', (delta) => send({ type: 'text', text: delta }));

    let message;
    try {
      message = await stream.finalMessage();
      retries = 0;
    } catch (err) {
      // Erreurs de l'API (clé, quota, surcharge) : remontées telles quelles.
      // Entrée d'outil illisible ou connexion coupée : on relance le tour (2 fois au plus).
      if (err instanceof Anthropic.APIError || retries++ >= 2) throw err;
      send({ type: 'retry' });
      continue;
    }

    usage.requests += 1;
    usage.input += message.usage.input_tokens ?? 0;
    usage.output += message.usage.output_tokens ?? 0;
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;

    if (message.stop_reason === 'refusal') {
      send({
        type: 'text',
        text: '\n\nJe ne peux pas répondre à cette demande. Je peux en revanche vous aider à choisir une voiture.',
      });
      return usage;
    }
    if (message.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: message.content });
      turn += 1;
      continue;
    }

    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    if (toolUses.length === 0) return usage; // réponse terminée

    // Une entrée d'outil coupée à max_tokens peut sembler valide : on ne l'exécute pas.
    if (message.stop_reason === 'max_tokens') {
      send({
        type: 'text',
        text: '\n\nLa réponse a été interrompue, pouvez-vous reformuler plus simplement ?',
      });
      return usage;
    }

    messages.push({ role: 'assistant', content: message.content });
    const results = toolUses.map((block) => {
      usage.tools.push(block.name);
      send({ type: 'status', text: TOOL_LABELS[block.name] || 'Recherche…' });
      const { content, isError } = runTool(block.name, block.input, { quizResults });
      return {
        type: 'tool_result',
        tool_use_id: block.id,
        content,
        ...(isError ? { is_error: true } : {}),
      };
    });
    // Tous les résultats dans un seul message (appels d'outils parallèles).
    messages.push({ role: 'user', content: results });
    turn += 1;
  }

  send({
    type: 'text',
    text: "\n\nJe n'ai pas pu terminer cette recherche. Pouvez-vous préciser votre demande ?",
  });
  return usage;
}
