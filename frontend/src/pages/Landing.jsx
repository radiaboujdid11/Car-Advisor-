import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HeroCanvas from '../components/HeroCanvas';
import AdSlot from '../components/AdSlot';


const STEPS = [
  { n: '1', title: 'Vos besoins', body: 'Usage quotidien, kilométrage, nombre de passagers, route ou ville.' },
  { n: '2', title: 'Votre budget', body: 'Achat, leasing, coût total de possession — nous calculons tout.' },
  { n: '3', title: 'Analyse IA', body: 'Notre moteur bayésien croise les critères techniques et votre profil.' },
  { n: '4', title: 'Vos 3 matchs', body: 'Top 3 personnalisé avec comparatif détaillé et score de compatibilité.' },
];

const FEATURES = [
  { icon: 'AI', title: 'IA Contextuelle', body: "S'adapte à chaque réponse pour poser les bonnes questions suivantes." },
  { icon: '%', title: 'Score de compatibilité', body: 'Chaque véhicule reçoit un score personnalisé basé sur votre profil.' },
  { icon: '€', title: 'Coût réel calculé', body: 'Carburant, entretien, budget total sur la durée estimés.' },
  { icon: 'VS', title: 'Comparatif détaillé', body: 'Vos 3 matchs côte à côte avec tous les critères techniques.' },
  { icon: '59', title: '59 modèles', body: 'De la citadine au SUV, thermique, hybride ou électrique.' },
  { icon: '3\'', title: 'Résultat en 3 min', body: 'Quiz adaptatif de 15 à 30 questions, résultats immédiats.' },
];

const QUIZ_PREVIEW = [
  { q: 'Quel est votre usage principal ?', opts: ['Trajets domicile-travail', 'Voyages longue distance', 'Usage mixte ville/route', 'Plaisir de conduite'] },
  { q: 'Votre budget mensuel ?', opts: ['Moins de 300€/mois', '300€ à 500€/mois', '500€ à 800€/mois', 'Plus de 800€/mois'] },
  { q: 'Quelle motorisation vous attire ?', opts: ['Essence / Diesel', 'Hybride rechargeable', '100% électrique', 'V8 ou plus — sensations'] },
];

export default function Landing() {
  const navigate = useNavigate();
  const previewRef = useRef(null);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: .15 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* ── Quiz preview cycling ── */
  useEffect(() => {
    let qi = 0;
    const card = previewRef.current;
    if (!card) return;

    function render() {
      const q = QUIZ_PREVIEW[qi];
      card.querySelector('#pq-text').textContent = q.q;
      card.querySelector('#pq-bar').style.width = ((qi + 1) / QUIZ_PREVIEW.length * 100) + '%';
      card.querySelector('#pq-num').textContent = qi + 1;
      const opts = card.querySelector('#pq-opts');
      opts.innerHTML = '';
      q.opts.forEach((o, i) => {
        const d = document.createElement('div');
        d.className = 'pq-opt' + (i === 0 ? ' active' : '');
        d.textContent = (i === 0 ? '✓  ' : '') + o;
        opts.appendChild(d);
      });
    }
    render();
    const t = setInterval(() => { qi = (qi + 1) % QUIZ_PREVIEW.length; render(); }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'relative', background: 'var(--bg)' }}>
      <HeroCanvas />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.5rem 4rem',
        borderBottom: '1px solid rgba(201,168,76,.08)',
        background: 'rgba(10,11,15,.6)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-.02em' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </div>
        <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none' }}>
          {[['#how', 'Comment ça marche'], ['#quiz', 'Questionnaire'], ['#features', 'Fonctionnalités']].map(([href, label]) => (
            <li key={href}>
              <a href={href} style={{ color: 'var(--ink-mute)', fontSize: '.88rem', letterSpacing: '.04em', textTransform: 'uppercase', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
              >{label}</a>
            </li>
          ))}
        </ul>
        <button
          onClick={() => navigate('/quiz')}
          style={{ background: 'var(--gold)', color: 'var(--bg)', border: 'none', padding: '.6rem 1.5rem', borderRadius: '50px', fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '.88rem', letterSpacing: '.02em', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-2)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Commencer →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Cars image — full bleed right */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/mcqueen.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          transform: 'scale(1.04)',
          animation: 'slowZoom 18s ease-in-out infinite alternate',
        }} />

        {/* Dark gradient — solid left, fades right */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #0D0D0D 0%, #0D0D0D 30%, rgba(13,13,13,.75) 55%, rgba(13,13,13,.15) 100%)',
        }} />

        {/* Bottom vignette for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,13,13,.6) 0%, transparent 40%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 4rem', maxWidth: '700px', paddingTop: '7rem', paddingBottom: '4rem' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', fontSize: '.75rem', letterSpacing: '.14em', textTransform: 'uppercase', padding: '.4rem 1.1rem', borderRadius: '50px', marginBottom: '2.5rem', animation: 'fadeDown .8s ease both' }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite', display: 'inline-block' }} />
            Kachow · Inférence Bayésienne
          </div>

          {/* Headline — editorial oversized */}
          <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 900, fontSize: 'clamp(3.8rem,9vw,7.5rem)', lineHeight: .9, letterSpacing: '-.04em', animation: 'fadeUp .9s .1s ease both', marginBottom: '2rem' }}>
            Trouve<br />
            <em style={{ fontStyle: 'normal', color: 'var(--gold)' }}>ton McQueen</em><br />
            <span style={{ fontSize: '55%', color: 'var(--ink-soft)', fontWeight: 700 }}>maintenant.</span>
          </h1>

          {/* Funny subtitle */}
          <p style={{ color: 'var(--ink-mute)', fontSize: '1.05rem', fontWeight: 300, maxWidth: '400px', lineHeight: 1.75, margin: '0 0 2.5rem', animation: 'fadeUp .9s .28s ease both' }}>
            Tout le monde mérite de rouler dans sa voiture idéale.{' '}
            <span style={{ color: 'var(--ivory)', fontStyle: 'italic' }}>Même Mater avait la sienne.</span>
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', animation: 'fadeUp .9s .42s ease both' }}>
            <button onClick={() => navigate('/quiz')} className="btn-primary" style={{ fontSize: '1rem', padding: '.85rem 2rem' }}>
              ⚡ Kachow — Démarrer
            </button>
            <button onClick={() => navigate('/cars')} className="btn-ghost">
              Explorer le catalogue
            </button>
          </div>

          {/* Cheeky footnote */}
          <p style={{ marginTop: '2rem', color: 'var(--ink-mute)', fontSize: '.78rem', letterSpacing: '.04em', animation: 'fadeUp .9s .56s ease both' }}>
            Aucune Fiat Multipla dans les résultats — on vous le garantit.
          </p>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', color: 'var(--ink-mute)', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', animation: 'fadeIn 1s 1.2s both' }}>
          <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, var(--gold), transparent)', animation: 'scrollPulse 2s infinite' }} />
          Découvrir
        </div>
      </section>

      {/* ── AD BANNER ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <AdSlot size="banner" />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '8rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-tag reveal">Processus</div>
        <h2 className="reveal" style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3.2rem)', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
          Comment <span style={{ color: 'var(--gold)' }}>AutoAssist</span><br />travaille pour vous
        </h2>
        <p className="reveal" style={{ color: 'var(--ink-mute)', fontSize: '1rem', maxWidth: '480px', lineHeight: 1.7, marginBottom: '4rem' }}>
          Notre IA sélectionne en temps réel la question la plus informative pour affiner votre recommandation à chaque réponse.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '2.8rem', left: '5%', right: '5%', height: '1px', background: 'linear-gradient(to right, transparent, var(--gold), transparent)', zIndex: 0 }} />
          {STEPS.map(s => (
            <div key={s.n} className="reveal card" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, background: 'var(--gold)', color: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.1rem', margin: '0 auto 1.2rem' }}>
                {s.n}
              </div>
              <h3 style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '.5rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--ink-mute)', fontSize: '.85rem', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUIZ PREVIEW ── */}
      <section id="quiz" style={{ position: 'relative', zIndex: 1, padding: '6rem 4rem', background: 'var(--bg-2)', borderTop: '1px solid rgba(201,168,76,.08)', borderBottom: '1px solid rgba(201,168,76,.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
          <div className="reveal">
            <div className="section-tag">Questionnaire intelligent</div>
            <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
              Des questions<br /><span style={{ color: 'var(--gold)' }}>qui comptent</span>
            </h2>
            <p style={{ color: 'var(--ink-mute)', lineHeight: 1.7, marginBottom: '2rem' }}>
              Chaque réponse affine l'algorithme. En 7 questions, le système en sait plus sur vos besoins qu'un vendeur en 2 heures.
            </p>
            <button onClick={() => navigate('/quiz')} className="btn-primary">Commencer maintenant →</button>
          </div>

          <div ref={previewRef} className="reveal" style={{ background: 'var(--bg-3)', border: '1px solid rgba(201,168,76,.2)', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 40px 80px rgba(0,0,0,.4)', transform: 'perspective(1000px) rotateY(-8deg) rotateX(2deg)', transition: 'transform .5s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(2deg)'; }}
          >
            <style>{`
              .pq-opt{padding:.75rem 1.2rem;border-radius:10px;border:1px solid rgba(245,240,232,.08);color:var(--ink-mute);font-size:.9rem;margin-bottom:.5rem;transition:all .2s;background:rgba(245,240,232,.03)}
              .pq-opt.active{background:rgba(201,168,76,.12);border-color:var(--gold);color:var(--ink)}
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '1.5rem', color: 'var(--ink-mute)', fontSize: '.82rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span>Question</span><span id="pq-num" style={{ color: 'var(--gold)', fontFamily: 'var(--serif-display)', fontSize: '1.2rem' }}>1</span><span>/ {QUIZ_PREVIEW.length}</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(245,240,232,.06)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div id="pq-bar" style={{ height: '100%', background: 'var(--gold)', borderRadius: '3px', transition: 'width .5s', width: '33%' }} />
            </div>
            <div id="pq-text" style={{ fontFamily: 'var(--serif-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.4 }}>Quel est votre usage principal ?</div>
            <div id="pq-opts" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '8rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-tag reveal">Fonctionnalités</div>
        <h2 className="reveal" style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3.2rem)', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
          Tout ce dont vous<br /><span style={{ color: 'var(--gold)' }}>avez besoin</span>
        </h2>
        <p className="reveal" style={{ color: 'var(--ink-mute)', fontSize: '1rem', maxWidth: '480px', lineHeight: 1.7, marginBottom: '4rem' }}>
          Pas juste un moteur de recherche — un vrai conseiller automobile piloté par l'IA bayésienne.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="reveal card" style={{ padding: '2rem' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: f.icon.length > 1 ? '.8rem' : '1.1rem', color: 'var(--gold)', letterSpacing: '-.01em' }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: '.98rem', marginBottom: '.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--ink-mute)', fontSize: '.83rem', lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '8rem 4rem', textAlign: 'center', background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(201,168,76,.12) 0%, transparent 70%)' }}>
        <h2 className="reveal" style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2.5rem,5vw,4rem)', letterSpacing: '-.04em', marginBottom: '1.2rem' }}>
          Prêt à trouver<br /><span style={{ color: 'var(--gold)' }}>votre voiture ?</span>
        </h2>
        <p className="reveal" style={{ color: 'var(--ink-mute)', fontSize: '1.05rem', maxWidth: '450px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Rejoignez les conducteurs qui ont trouvé leur match parfait en moins de 3 minutes.
        </p>
        <button className="reveal btn-primary" onClick={() => navigate('/quiz')} style={{ fontSize: '1.1rem', padding: '1rem 2.8rem' }}>
          Démarrer gratuitement →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(245,240,232,.06)', padding: '2rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ink-mute)', fontSize: '.8rem' }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.1rem' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </div>
        <div>© 2026 AutoAssist · Propulsé par l'IA bayésienne</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link to="/cars" style={{ color: 'var(--ink-mute)', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}>Catalogue</Link>
          <Link to="/compare" style={{ color: 'var(--ink-mute)', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}>Comparateur</Link>
        </div>
      </footer>
    </div>
  );
}
