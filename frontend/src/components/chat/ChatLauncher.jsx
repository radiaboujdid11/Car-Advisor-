import { Suspense, lazy, useState } from 'react';

// Le panneau (et son code) n'est téléchargé qu'au premier clic.
const ChatPanel = lazy(() => import('./ChatPanel'));

/** Bouton flottant de l'assistant. `aboveTabBar` : le remonter au-dessus de la barre d'onglets mobile. */
export default function ChatLauncher({ aboveTabBar }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant AutoAssist"
          className={`chat-launcher fixed right-4 z-[150] inline-flex h-14 items-center gap-2 rounded-full pl-4 pr-5 md:right-6 ${
            aboveTabBar ? 'chat-launcher--tabbar' : ''
          }`}
          style={{
            background: 'var(--gold-deep)',
            color: '#fff',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: '0 8px 24px rgba(42,31,18,.3)',
          }}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
          </svg>
          Assistant
        </button>
      )}
      {open && (
        <Suspense fallback={null}>
          <ChatPanel onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
