import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot';
import { CARS } from '../data/cars';

const STEPS = [
  { n: '01', title: 'Vos besoins', body: 'Usage, kilométrage, passagers, route ou ville. Chaque détail oriente l\'algorithme.', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop' },
  { n: '02', title: 'Votre budget', body: 'Achat, leasing ou coût total sur la durée. On calcule tout, frais compris.', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop' },
  { n: '03', title: 'Votre voiture', body: 'Le moteur bayésien croise votre profil et 59 modèles. Résultat en 3 minutes.', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop' },
];

const FEATURES = [
  { label: 'AI', title: 'IA Contextuelle', body: "Chaque réponse réoriente l'algorithme vers les questions les plus révélatrices.", img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80&auto=format&fit=crop' },
  { label: '%',  title: 'Score personnalisé', body: 'Chaque véhicule reçoit un score calculé sur votre profil exact, pas une moyenne.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop' },
  { label: '€',  title: 'Coût réel', body: 'Carburant, entretien et budget total estimés sur la durée de possession.', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80&auto=format&fit=crop' },
  { label: 'VS', title: 'Comparatif', body: 'Vos 3 matchs côte à côte avec tous les critères techniques et économiques.', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop' },
  { label: '59', title: '59 modèles', body: 'Citadine, SUV, berline — thermique, hybride ou électrique. Aucun oublié.', img: 'https://images.unsplash.com/photo-1537984822441-cff330075342?w=800&q=80&auto=format&fit=crop' },
  { label: "3'", title: 'Résultat immédiat', body: 'De 15 à 30 questions adaptatives. Le meilleur rapport précision / rapidité.', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop' },
];

const QUIZ_PREVIEW = [
  { q: 'Quel est votre usage principal ?', opts: ['Trajets domicile-travail', 'Voyages longue distance', 'Usage mixte', 'Plaisir de conduite'] },
  { q: 'Votre budget mensuel ?', opts: ['Moins de 300 €', '300 € à 500 €', '500 € à 800 €', 'Plus de 800 €'] },
  { q: 'Quelle motorisation vous attire ?', opts: ['Essence / Diesel', 'Hybride rechargeable', '100 % électrique', 'V8 ou plus'] },
];

const BRANDS = ['Peugeot', 'Renault', 'Dacia', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Tesla', 'Kia', 'Volkswagen', 'Citroën', 'Volvo', 'Porsche', 'Alfa Romeo', 'Hyundai', 'Ford'];

const rule = { height: '1px', background: 'rgba(240,240,240,.08)' };
const copper = 'rgba(255,255,255,.3)';

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
          border-top:1px solid rgba(26,13,6,.08);
          font-family:var(--sans);font-size:.82rem;
          color:${i === 0 ? 'var(--gold)' : 'var(--ink-mute)'};
          display:flex;align-items:center;gap:.75rem;
          transition:color .2s;
        `;
        const dot = `<span style="width:14px;height:14px;flex-shrink:0;border:1px solid ${i === 0 ? 'var(--gold)' : 'rgba(240,240,240,.2)'};display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;color:var(--gold);">${i === 0 ? '✓' : ''}</span>`;
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
        borderBottom: `1px solid rgba(26,13,6,.08)`,
        background: 'rgba(255,255,255,.95)',
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
          style={{ background: 'var(--gold)', color: '#ffffff', border: 'none', padding: '.55rem 1.5rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
        >Commencer</button>
      </nav>

      {/* ── HERO: full bleed ── */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '600px', overflow: 'hidden' }}>

        {/* Full image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/hero.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'slowZoom 22s ease-in-out infinite alternate',
        }} />

        {/* Gradient at bottom so text is readable */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(26,13,6,.8) 0%, rgba(26,13,6,.3) 45%, transparent 75%)',
        }} />

        {/* Text overlay — bottom left */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(2.5rem,6vh,5rem)',
          left: 'clamp(1.5rem,5vw,5rem)',
          maxWidth: '600px',
        }}>
          <h1 style={{
            fontFamily: 'var(--sans)',
            fontWeight: 900,
            fontSize: 'clamp(3rem,7vw,6rem)',
            lineHeight: 1,
            letterSpacing: '-.01em',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '.85rem',
          }}>
            TROUVE TON<br />MCQUEEN
          </h1>

          <p style={{
            fontFamily: 'var(--sans)',
            fontWeight: 400,
            fontSize: 'clamp(.82rem,1vw,.95rem)',
            color: 'rgba(255,255,255,.8)',
            lineHeight: 1.65,
            marginBottom: '1.75rem',
            maxWidth: '480px',
          }}>
            Quinze questions. Un moteur bayésien. Le véhicule qui correspond exactement à votre vie.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/quiz')}
              style={{ background: '#ffffff', color: '#f0ebe3', border: '2px solid #ffffff', padding: '.72rem 1.9rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#f0ebe3'; }}
            >DÉMARRER LE QUIZ</button>
            <button
              onClick={() => navigate('/cars')}
              style={{ background: 'transparent', color: '#ffffff', border: '2px solid #ffffff', padding: '.72rem 1.9rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#f0ebe3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
            >CATALOGUE</button>
          </div>
        </div>
      </section>

      {/* ── PHOTO MARQUEE ── */}
      <div style={{ background: '#f0ebe3', padding: '1.2rem 0', overflow: 'hidden', borderTop: '1px solid rgba(242,216,167,.06)', borderBottom: '1px solid rgba(242,216,167,.06)' }}>
        <div className="marquee-track">
          {[...CARS.filter(c => c.image), ...CARS.filter(c => c.image)].map((car, i) => (
            <div key={i} style={{ flexShrink: 0, width: '220px', height: '130px', marginRight: '1rem', overflow: 'hidden', borderRadius: '6px', position: 'relative' }}>
              <img
                src={car.image}
                alt={`${car.make} ${car.model}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,13,6,.65) 0%, transparent 55%)' }} />
              <p style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', fontFamily: 'var(--sans)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', opacity: 0.9 }}>
                {car.make} {car.model}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(26,13,6,.08)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '5.5rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Comment ça marche</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} className="reveal" style={{ background: '#faf6f1', border: '1px solid rgba(242,216,167,.1)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color .25s, transform .25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img src={s.img} alt={s.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .6s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #faf6f1 0%, transparent 55%)' }} />
                  <span style={{ position: 'absolute', top: '1rem', left: '1.25rem', fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 700, color: 'rgba(242,216,167,.8)' }}>{s.n}</span>
                </div>
                <div style={{ padding: '1.5rem 1.75rem 2rem' }}>
                  <h3 style={{ fontFamily: 'var(--serif-body)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.6rem', lineHeight: 1.2 }}>{s.title}</h3>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '.83rem', color: 'var(--ink-mute)', lineHeight: 1.8 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIZ PREVIEW ── */}
      <section id="quiz" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(26,13,6,.08)', background: '#f0ebe3' }}>
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
                style={{ background: 'transparent', color: 'var(--gold)', border: '1px solid rgba(255,255,255,.45)', padding: '.9rem 2rem', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.75rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.7rem' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
              >
                Commencer <span>→</span>
              </button>
            </div>

            {/* Preview card */}
            <div ref={previewRef} className="reveal" style={{ background: '#ffffff', border: '1px solid rgba(26,13,6,.09)', overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(26,13,6,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,13,6,.15)' }}>
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
      <section id="features" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(26,13,6,.08)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '5.5rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Fonctionnalités</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="reveal" style={{ background: '#faf6f1', border: '1px solid rgba(242,216,167,.1)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color .25s, transform .25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,216,167,.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img src={f.img} alt={f.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .6s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #faf6f1 0%, transparent 60%)' }} />
                  <span style={{ position: 'absolute', top: '.75rem', left: '.75rem', fontFamily: 'var(--mono)', fontSize: '.58rem', letterSpacing: '.1em', color: 'var(--gold)', border: '1px solid rgba(242,216,167,.4)', borderRadius: '4px', padding: '.2rem .5rem', background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(6px)' }}>{f.label}</span>
                </div>
                <div style={{ padding: '1.25rem 1.5rem 1.75rem' }}>
                  <h3 style={{ fontFamily: 'var(--serif-body)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.5rem', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '.82rem', color: 'var(--ink-mute)', lineHeight: 1.78 }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAR SHOWCASE ── */}
      <section style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(26,13,6,.08)', background: '#f0ebe3' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Quelques modèles</span>
              <div style={{ width: '60px', height: '1px', background: copper }} />
            </div>
            <Link to="/cars" style={{ fontFamily: 'var(--sans)', fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: '.5rem' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
            >Voir les 62 modèles →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {CARS.filter(c => c.image).slice(0, 6).map(car => (
              <Link key={car.id} to={`/cars/${car.id}`} style={{ display: 'block', background: '#faf6f1', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color .25s, transform .25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: '170px', overflow: 'hidden', background: '#f0ebe3' }}>
                  <img src={car.image} alt={`${car.make} ${car.model}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform .5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '.4rem' }}>{car.category}</p>
                  <h3 style={{ fontFamily: 'var(--serif-display)', fontSize: '1.1rem', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '.5rem' }}>{car.make} {car.model}</h3>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--gold)' }}>
                    {car.price_eur ? `${Math.round(car.price_eur * 10.8).toLocaleString('fr-FR')} DH` : 'Sur demande'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--gold)', padding: '7rem 5vw' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'rgba(240,235,227,.55)', marginBottom: '1rem' }}>Prêt ?</p>
            <h2 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2.8rem,5vw,5rem)', lineHeight: .88, letterSpacing: '-.04em', color: '#ffffff' }}>
              Votre McQueen<br />vous attend.
            </h2>
          </div>
          <button
            onClick={() => navigate('/quiz')}
            style={{ background: '#ffffff', color: 'var(--gold)', border: 'none', padding: '1.2rem 3.2rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0ebe3'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            Démarrer le quiz <span style={{ fontSize: '1rem' }}>→</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2rem 3.5rem', borderTop: '1px solid rgba(26,13,6,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
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
