import { Link } from 'react-router-dom';

// Rendu Markdown minimal et sûr des réponses de l'assistant : paragraphes, listes « - »,
// **gras** et liens internes [texte](/cars/123). Aucun HTML n'est interprété ;
// les liens externes sont affichés comme du texte.

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text, keyPrefix, onNavigate) {
  const out = [];
  let last = 0;
  let m;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${m.index}`;
    if (m[1]) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else if (/^\/[a-z0-9/-]*$/i.test(m[3])) {
      out.push(
        <Link
          key={key}
          to={m[3]}
          onClick={onNavigate}
          style={{ color: 'var(--gold-deep)', textDecoration: 'underline', fontWeight: 600 }}
        >
          {m[2]}
        </Link>,
      );
    } else {
      out.push(m[2]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, onNavigate }) {
  const blocks = text.trim().split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split('\n');
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
      return (
        <ul key={bi} style={{ paddingLeft: '1.1rem', margin: '.35rem 0', listStyle: 'disc' }}>
          {lines.map((l, li) => (
            <li key={li} style={{ margin: '.15rem 0' }}>
              {renderInline(l.replace(/^\s*[-*•]\s+/, ''), `${bi}-${li}`, onNavigate)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} style={{ margin: '.35rem 0' }}>
        {lines.map((l, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {renderInline(l.replace(/^#+\s*/, ''), `${bi}-${li}`, onNavigate)}
          </span>
        ))}
      </p>
    );
  });
}
