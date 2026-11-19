import { useCallback, useEffect, useRef, useState } from 'react';
import RichText from './RichText';
import { describeHttpError, readQuizResults, streamChat } from './chatClient';

// Conversation gardée le temps de l'onglet (sessionStorage), jamais envoyée ailleurs que /api/chat.
const STORAGE_KEY = 'carAdvisor_chat';
const MAX_INPUT = 800;

const SUGGESTIONS = [
  'Un SUV familial à moins de 300 000 DH ?',
  'Les voitures électriques les moins chères',
  'Explique-moi les résultats de mon quiz',
  'Compare la Dacia Sandero et la Renault Clio',
];

function loadConversation() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState(loadConversation);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const abortRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* stockage indisponible : la conversation reste en mémoire */
    }
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      abortRef.current?.abort();
    };
  }, [onClose]);

  const send = useCallback(
    async (rawText) => {
      const content = rawText.trim().slice(0, MAX_INPUT);
      if (!content || busy) return;
      const history = [
        ...messages.filter((m) => !m.error).map(({ role, content: c }) => ({ role, content: c })),
        { role: 'user', content },
      ];
      setMessages((prev) => [
        ...prev,
        { role: 'user', content },
        { role: 'assistant', content: '' },
      ]);
      setInput('');
      setBusy(true);
      setStatus('Réflexion…');

      const controller = new AbortController();
      abortRef.current = controller;
      let text = '';
      let turnStart = 0;
      let failed = false;
      const update = (patch) =>
        setMessages((prev) => [...prev.slice(0, -1), { ...prev.at(-1), ...patch }]);

      try {
        await streamChat({
          messages: history,
          quiz: readQuizResults(),
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'turn') turnStart = text.length;
            else if (event.type === 'retry') text = text.slice(0, turnStart);
            else if (event.type === 'status') setStatus(event.text);
            else if (event.type === 'text') {
              text += event.text;
              setStatus('');
            } else if (event.type === 'error') {
              failed = true;
              update({
                content: text ? `${text}\n\n${event.message}` : event.message,
                error: !text,
              });
              return;
            }
            update({ content: text });
          },
        });
        if (!text && !failed) {
          update({ content: 'Je n’ai pas de réponse pour le moment. Réessayez ?', error: true });
        }
      } catch (err) {
        const message = describeHttpError(err);
        if (message) update({ content: message, error: true });
        else update({ content: text || '(réponse interrompue)' });
      } finally {
        setBusy(false);
        setStatus('');
        abortRef.current = null;
      }
    },
    [busy, messages],
  );

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Assistant AutoAssist"
      className="chat-panel fixed inset-0 z-[300] flex flex-col overflow-hidden md:inset-auto md:bottom-6 md:right-6 md:h-[min(640px,calc(100vh-3rem))] md:w-[400px] md:rounded-2xl"
      style={{ background: 'var(--bg)', boxShadow: '0 20px 60px rgba(42,31,18,.25)' }}
    >
      {/* En-tête */}
      <div
        className="flex shrink-0 items-center gap-2 px-4 py-2"
        style={{ background: '#170E00', color: '#F5EFE3' }}
      >
        <div className="min-w-0 flex-1">
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: '1.05rem' }}>
            Assistant AutoAssist
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: '#C9A06A' }}>
            Réponses générées par IA · prix indicatifs
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded-full px-3"
            style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: '#F5EFE3' }}
          >
            Nouvelle
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'assistant"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full"
          style={{ color: '#F5EFE3', background: 'rgba(255,255,255,.08)', fontSize: '1.1rem' }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        style={{
          fontFamily: 'var(--sans)',
          fontSize: '15px',
          lineHeight: 1.5,
          color: 'var(--ink)',
        }}
      >
        {messages.length === 0 && (
          <div>
            <p style={{ marginBottom: '.75rem' }}>
              Bonjour ! Je vous aide à trouver une voiture parmi les modèles du catalogue, à les
              comparer ou à comprendre les résultats de votre quiz.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="min-h-[44px] rounded-xl px-3 py-2 text-left"
                  style={{
                    fontSize: '14px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            data-testid={m.role === 'user' ? 'chat-user' : 'chat-assistant'}
            className={m.role === 'user' ? 'ml-auto' : 'mr-auto'}
            style={{
              maxWidth: '88%',
              marginBottom: '.75rem',
              padding: '.6rem .85rem',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background:
                m.role === 'user' ? 'var(--gold-deep)' : m.error ? '#F6E3DC' : 'var(--bg-2)',
              color: m.role === 'user' ? '#fff' : 'var(--ink)',
              whiteSpace: m.role === 'user' ? 'pre-wrap' : undefined,
              overflowWrap: 'anywhere',
            }}
          >
            {m.role === 'user' ? (
              m.content
            ) : m.content ? (
              <RichText text={m.content} onNavigate={() => window.innerWidth < 768 && onClose()} />
            ) : (
              <span style={{ color: 'var(--ink-soft)' }}>…</span>
            )}
          </div>
        ))}

        {status && (
          <p
            role="status"
            style={{ fontSize: '13px', color: 'var(--ink-soft)', fontStyle: 'italic' }}
          >
            {status}
          </p>
        )}
      </div>

      {/* Saisie */}
      <form
        className="flex shrink-0 items-end gap-2 px-3 pt-2"
        style={{
          borderTop: '1px solid var(--line)',
          paddingBottom: 'calc(.5rem + env(safe-area-inset-bottom))',
          background: 'var(--bg)',
        }}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Votre message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={MAX_INPUT}
          disabled={busy}
          placeholder="Posez votre question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          className="min-h-[44px] flex-1 resize-none rounded-xl px-3 py-2"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '16px', // 16 px : pas de zoom automatique sur iPhone
            maxHeight: '120px',
            background: '#fff',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
        />
        {busy ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex h-11 shrink-0 items-center rounded-full px-4"
            style={{ fontFamily: 'var(--sans)', fontSize: '14px', border: '1px solid var(--line)' }}
          >
            Arrêter
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-11 shrink-0 items-center rounded-full px-4"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: input.trim() ? 'var(--gold-2)' : 'rgba(42,31,18,.3)',
            }}
          >
            Envoyer
          </button>
        )}
      </form>
    </div>
  );
}
