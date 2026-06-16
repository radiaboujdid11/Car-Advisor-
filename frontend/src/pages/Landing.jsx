import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot';

const STEPS = [
  { n: '01', title: 'Vos besoins', body: 'Usage, kilométrage, passagers, route ou ville. Chaque détail oriente l\'algorithme.' },
  { n: '02', title: 'Votre budget', body: 'Achat, leasing ou coût total sur la durée. On calcule tout, frais compris.' },
  { n: '03', title: 'Votre voiture', body: 'Le moteur bayésien croise votre profil et 59 modèles. Résultat en 3 minutes.' },
];

const FEATURES = [
  { label: 'AI', title: 'IA Contextuelle', body: "Chaque réponse réoriente l'algorithme vers les questions les plus révélatrices." },
  { label: '%',  title: 'Score personnalisé', body: 'Chaque véhicule reçoit un score calculé sur votre profil exact, pas une moyenne.' },
  { label: '€',  title: 'Coût réel', body: 'Carburant, entretien et budget total estimés sur la durée de possession.' },
  { label: 'VS', title: 'Comparatif', body: 'Vos 3 matchs côte à côte avec tous les critères techniques et économiques.' },
  { label: '59', title: '59 modèles', body: 'Citadine, SUV, berline — thermique, hybride ou électrique. Aucun oublié.' },
  { label: "3'", title: 'Résultat immédiat', body: 'De 15 à 30 questions adaptatives. Le meilleur rapport précision / rapidité.' },
];

const QUIZ_PREVIEW = [
  { q: 'Quel est votre usage principal ?', opts: ['Trajets domicile-travail', 'Voyages longue distance', 'Usage mixte', 'Plaisir de conduite'] },
  { q: 'Votre budget mensuel ?', opts: ['Moins de 300 €', '300 € à 500 €', '500 € à 800 €', 'Plus de 800 €'] },
  { q: 'Quelle motorisation vous attire ?', opts: ['Essence / Diesel', 'Hybride rechargeable', '100 % électrique', 'V8 ou plus'] },
];

const BRANDS = ['Peugeot', 'Renault', 'Dacia', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Tesla', 'Kia', 'Volkswagen', 'Citroën', 'Volvo', 'Porsche', 'Alfa Romeo', 'Hyundai', 'Ford'];

const rule = { height: '1px', background: 'rgba(242,216,167,.08)' };
const copper = 'rgba(217,136,89,.3)';

export default function Landing() {
  const navigate = useNavigate();
  const previewRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: .1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let qi = 0;
    const card = previewRef.current;
    if (!card) return;
    function render() {
      const q = QUIZ_PREVIEW[qi];
      card.querySelector('#pq-text').textContent = q.q;
      card.querySelector('#pq-step').textContent = `${qi + 1} / ${QUIZ_PREVIEW.length}`;
      const opts = card.querySelector('#pq-opts');
      opts.innerHTML = '';
      q.opts.forEach((o, i) => {
        const d = document.createElement('div');
        d.style.cssText = `
          padding:.8rem 1rem;
          border-top:1px solid rgba(242,216,167,.07);
          font-family:var(--sans);font-size:.82rem;
          color:${i === 0 ? 'var(--gold)' : 'var(--ink-mute)'};
          display:flex;align-items:center;gap:.75rem;
          transition:color .2s;
        `;
        const dot = `<span style="width:14px;height:14px;flex-shrink:0;border:1px solid ${i === 0 ? 'var(--gold)' : 'rgba(242,216,167,.2)'};display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;color:var(--gold);">${i === 0 ? '✓' : ''}</span>`;
        d.innerHTML = dot + o;
        opts.appendChild(d);
      });
    }
    render();
    const t = setInterval(() => { qi = (qi + 1) % QUIZ_PREVIEW.length; render(); }, 3400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 3.5rem',
        borderBottom: `1px solid rgba(242,216,167,.07)`,
        background: 'rgba(45,25,18,.95)',
        backdropFilter: 'blur(24px)',
      }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontSize: '1.15rem', letterSpacing: '-.02em', userSelect: 'none' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </div>

        <div className="nav-mobile-links" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {[['#how', 'Méthode'], ['#quiz', 'Quiz'], ['#features', 'Fonctionnalités']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: 'var(--sans)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
            >{label}</a>
          ))}
        </div>

        <button
          onClick={() => navigate('/quiz')}
          style={{ background: 'var(--gold)', color: '#3E2621', border: 'none', padding: '.55rem 1.5rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F2D8A7'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
        >Commencer</button>
      </nav>

      {/* ── HERO: split screen ── */}
      <section className="hero-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

        {/* Left — editorial type */}
        <div className="hero-text" style={{
          background: '#3E2621',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(7rem,11vw,10rem) clamp(2rem,5vw,5.5rem) 5rem',
          borderRight: `1px solid rgba(242,216,167,.06)`,
        }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '2.5rem', opacity: .85 }}>
            Conseil automobile · IA bayésienne
          </p>

          <h1 style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(4.2rem,7.5vw,8rem)',
            lineHeight: .88,
            letterSpacing: '-.04em',
            color: 'var(--ink)',
            marginBottom: '2.5rem',
          }}>
            Trouve<br />
            <span style={{ color: 'var(--gold)' }}>ton</span><br />
            McQueen
          </h1>

          <div style={{ width: '2.5rem', height: '1px', background: 'var(--gold)', marginBottom: '2rem', opacity: .6 }} />

          <p style={{ fontFamily: 'var(--sans)', fontSize: '.92rem', color: 'var(--ink-soft)', lineHeight: 1.8, maxWidth: '370px', marginBottom: '3rem' }}>
            Quinze questions. Un moteur bayésien. Le véhicule qui correspond exactement à votre vie — pas celui que tout le monde achète.
          </p>

          <div style={{ display: 'flex', gap: '.85rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => navigate('/quiz')}
              style={{ background: 'var(--gold)', color: '#3E2621', border: 'none', padding: '.95rem 2.4rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.7rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F2D8A7'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
            >
              Démarrer le quiz <span style={{ fontSize: '1rem', fontFamily: 'serif' }}>→</span>
            </button>
            <button
              onClick={() => navigate('/cars')}
              style={{ background: 'transparent', color: 'var(--ink-mute)', border: '1px solid rgba(242,216,167,.18)', padding: '.95rem 1.8rem', fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '.78rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.45)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.18)'; e.currentTarget.style.color = 'var(--ink-mute)'; }}
            >
              Catalogue
            </button>
          </div>

          <p style={{ fontFamily: 'var(--sans)', fontSize: '.65rem', letterSpacing: '.04em', color: 'var(--ink-mute)', opacity: .55 }}>
            Aucune Fiat Multipla dans les résultats — garanti.
          </p>
        </div>

        {/* Right — image */}
        <div className="hero-image" style={{ position: 'relative', minHeight: '60vh', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/mcqueen.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'slowZoom 22s ease-in-out infinite alternate',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #3E2621 0%, transparent 12%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(62,38,33,.55) 0%, transparent 35%)' }} />
        </div>
      </section>

      {/* ── BRAND MARQUEE ── */}
      <div style={{ ...rule, position: 'relative' }} />
      <div style={{ background: '#2a1a10', padding: '.9rem 0', overflow: 'hidden', borderBottom: '1px solid rgba(242,216,167,.06)' }}>
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} style={{ fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--ink-mute)', paddingRight: '2.5rem', opacity: .55 }}>
              {b}<span style={{ color: 'var(--gold)', marginLeft: '2.5rem', opacity: .6 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(242,216,167,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '5.5rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Comment ça marche</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderLeft: '1px solid rgba(242,216,167,.07)' }}>
            {STEPS.map((s, i) => (
              <div key={i} className="reveal" style={{ borderRight: '1px solid rgba(242,216,167,.07)', padding: '3.5rem 3rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4f3520'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'var(--mono)', fontSize: '3rem', fontWeight: 700, color: 'rgba(217,136,89,.15)', lineHeight: 1, marginBottom: '2.5rem', letterSpacing: '-.02em' }}>{s.n}</div>
                <h3 style={{ fontFamily: 'var(--serif-body)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.85rem', lineHeight: 1.2 }}>{s.title}</h3>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '.84rem', color: 'var(--ink-mute)', lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIZ PREVIEW ── */}
      <section id="quiz" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(242,216,167,.07)', background: '#2a1a10' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
            <div className="reveal">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Le quiz</span>
                <div style={{ flex: 1, height: '1px', background: copper }} />
              </div>

              <h2 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2.8rem,5vw,5rem)', lineHeight: .88, letterSpacing: '-.04em', color: 'var(--ink)', marginBottom: '2rem' }}>
                Des questions<br /><span style={{ color: 'var(--gold)' }}>qui comptent.</span>
              </h2>

              <p style={{ fontFamily: 'var(--sans)', fontSize: '.88rem', color: 'var(--ink-mute)', lineHeight: 1.82, maxWidth: '400px', marginBottom: '2.5rem' }}>
                Chaque réponse affine l'algorithme. En 10 questions, le système en sait plus sur vos besoins qu'un vendeur en deux heures.
              </p>

              <button
                onClick={() => navigate('/quiz')}
                style={{ background: 'transparent', color: 'var(--gold)', border: '1px solid rgba(217,136,89,.45)', padding: '.9rem 2rem', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.75rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.7rem' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#3E2621'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
              >
                Commencer <span>→</span>
              </button>
            </div>

            {/* Preview card */}
            <div ref={previewRef} className="reveal" style={{ background: '#3E2621', border: '1px solid rgba(242,216,167,.09)', overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(242,216,167,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,.15)' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', opacity: .7 }}>Aperçu du quiz</span>
                <span id="pq-step" style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: 'var(--ink-mute)' }}>1 / 3</span>
              </div>
              <div style={{ padding: '1.75rem 1.4rem 1.2rem' }}>
                <div id="pq-text" style={{ fontFamily: 'var(--serif-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '1.1rem' }}>
                  Quel est votre usage principal ?
                </div>
                <div id="pq-opts" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '4rem' }}>
            <AdSlot size="banner" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(242,216,167,.07)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '5.5rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Fonctionnalités</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderLeft: '1px solid rgba(242,216,167,.07)', borderTop: '1px solid rgba(242,216,167,.07)' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="reveal" style={{ borderRight: '1px solid rgba(242,216,167,.07)', borderBottom: '1px solid rgba(242,216,167,.07)', padding: '2.75rem 2.5rem', transition: 'background .25s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4f3520'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: '.65rem', letterSpacing: '.1em', color: 'var(--gold)', border: '1px solid rgba(217,136,89,.28)', padding: '.22rem .6rem', marginBottom: '1.4rem' }}>{f.label}</span>
                <h3 style={{ fontFamily: 'var(--serif-body)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.6rem', lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '.82rem', color: 'var(--ink-mute)', lineHeight: 1.78 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--gold)', padding: '7rem 5vw' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'rgba(62,38,33,.55)', marginBottom: '1rem' }}>Prêt ?</p>
            <h2 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2.8rem,5vw,5rem)', lineHeight: .88, letterSpacing: '-.04em', color: '#3E2621' }}>
              Votre McQueen<br />vous attend.
            </h2>
          </div>
          <button
            onClick={() => navigate('/quiz')}
            style={{ background: '#3E2621', color: 'var(--gold)', border: 'none', padding: '1.2rem 3.2rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a1a10'}
            onMouseLeave={e => e.currentTarget.style.background = '#3E2621'}
          >
            Démarrer le quiz <span style={{ fontSize: '1rem' }}>→</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2rem 3.5rem', borderTop: '1px solid rgba(242,216,167,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontSize: '1rem' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.06em', color: 'var(--ink-mute)', opacity: .45 }}>
          © 2026 AutoAssist · Propulsé par l'inférence bayésienne
        </p>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[['Catalogue', '/cars'], ['Comparateur', '/compare']].map(([l, to]) => (
            <Link key={to} to={to} style={{ fontFamily: 'var(--sans)', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
            >{l}</Link>
          ))}
        </div>
      </footer>

    </div>
  );
}
