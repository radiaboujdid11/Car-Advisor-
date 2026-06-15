export default function AdSlot({ size = 'banner', children }) {
  const isBanner = size === 'banner';

  const wrapper = {
    position: 'relative',
    width: '100%',
    minHeight: isBanner ? '120px' : '280px',
    background: 'rgba(242,216,167,.06)',
    border: '1px dashed rgba(242,216,167,.25)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const label = {
    position: 'absolute',
    top: '8px',
    right: '10px',
    fontSize: '10px',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-mute)',
    opacity: .5,
  };

  const placeholder = {
    textAlign: 'center',
    padding: '2rem',
  };

  return (
    <div style={wrapper}>
      <span style={label}>Publicité</span>
      {children ?? (
        <div style={placeholder}>
          <div style={{ fontSize: '1.4rem', marginBottom: '.4rem' }}>📣</div>
          <div style={{ color: 'var(--ink-mute)', fontSize: '.82rem', letterSpacing: '.04em' }}>
            Votre publicité ici
          </div>
          <div style={{ color: 'var(--ink-mute)', fontSize: '.72rem', opacity: .6, marginTop: '.3rem' }}>
            {isBanner ? '728 × 90 · leaderboard' : '300 × 250 · rectangle'}
          </div>
        </div>
      )}
    </div>
  );
}
