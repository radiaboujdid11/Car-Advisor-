import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CARS } from '../data/cars';

const STEPS = [
  { n: '01', title: 'Vos besoins', body: 'Usage, kilométrage, passagers, route ou ville. Chaque détail oriente l\'algorithme.', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop' },
  { n: '02', title: 'Votre budget', body: 'Achat, leasing ou coût total sur la durée. On calcule tout, frais compris.', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&auto=format&fit=crop' },
  { n: '03', title: 'Votre voiture', body: 'Le moteur bayésien croise votre profil et 59 modèles. Résultat en 3 minutes.', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop' },
];

const FEATURES = [
  { label: 'AI', title: 'IA Contextuelle', body: "Chaque réponse réoriente l'algorithme vers les questions les plus révélatrices.", img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80&auto=format&fit=crop' },
  { label: '%',  title: 'Score personnalisé', body: 'Chaque véhicule reçoit un score calculé sur votre profil exact, pas une moyenne.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop' },
  { label: 'DH', title: 'Coût réel', body: 'Carburant, entretien et budget total estimés sur la durée de possession.', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80&auto=format&fit=crop' },
  { label: 'VS', title: 'Comparatif', body: 'Vos 3 matchs côte à côte avec tous les critères techniques et économiques.', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop' },
  { label: '59', title: '59 modèles', body: 'Citadine, SUV, berline — thermique, hybride ou électrique. Aucun oublié.', img: 'https://images.unsplash.com/photo-1537984822441-cff330075342?w=800&q=80&auto=format&fit=crop' },
  { label: "3'", title: 'Résultat immédiat', body: 'De 15 à 30 questions adaptatives. Le meilleur rapport précision / rapidité.', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop' },
];


const BRANDS = ['Peugeot', 'Renault', 'Dacia', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Tesla', 'Kia', 'Volkswagen', 'Citroën', 'Volvo', 'Porsche', 'Alfa Romeo', 'Hyundai', 'Ford'];

const rule = { height: '1px', background: 'rgba(42,31,18,.08)' };
const copper = 'rgba(42,31,18,.2)';

export default function Landing() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: .1 }
    );
    document.querySelectorAll('.reveal, .slide-left').forEach(el => obs.observe(el));
    const ticker = setInterval(() => setActiveStep(i => (i + 1) % STEPS.length), 4200);
    return () => { obs.disconnect(); clearInterval(ticker); };
  }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.4rem 3.5rem',
        background: 'transparent',
      }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontSize: '1.15rem', letterSpacing: '-.02em', userSelect: 'none', color: '#fff' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </div>

        <div className="nav-mobile-links" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {[['#how', 'Méthode'], ['#quiz', 'Quiz'], ['#features', 'Fonctionnalités'], ['/cars', 'Catalogue'], ['/compare', 'Comparateur']].map(([href, label]) => {
            const isRoute = href.startsWith('/');
            const style = { fontFamily: 'var(--sans)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', cursor: 'pointer', textDecoration: 'none' };
            return isRoute
              ? <Link key={href} to={href} style={style}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.8)'}
                >{label}</Link>
              : <a key={href} href={href} style={style}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.8)'}
                >{label}</a>;
          })}
        </div>

        <button
          onClick={() => navigate('/quiz')}
          style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.7)', padding: '.65rem 1.8rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '50px', backdropFilter: 'blur(8px)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.7)'; }}
        >Commencer</button>
      </nav>

      {/* ── HERO: full bleed ── */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '600px', overflow: 'hidden' }}>

        {/* Full image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/hero2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'slowZoom 22s ease-in-out infinite alternate',
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(42,31,18,.85) 0%, rgba(42,31,18,.4) 45%, transparent 75%)',
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
            background: 'linear-gradient(135deg, #ffffff 0%, #E8D5C4 50%, #C17B5A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '.85rem',
          }}>
            TROUVE TON<br />MCQUEEN
          </h1>

          <p style={{
            fontFamily: 'var(--sans)',
            fontWeight: 400,
            fontSize: '.72rem',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.75)',
            lineHeight: 2,
            marginBottom: '1.75rem',
            maxWidth: '480px',
          }}>
            Quinze questions. Un moteur bayésien. Le véhicule qui correspond exactement à votre vie.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/quiz')}
              style={{ background: 'var(--gold)', color: '#ffffff', border: '2px solid var(--gold)', padding: '1rem 2.6rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .2s, border-color .2s', borderRadius: '50px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-2)'; e.currentTarget.style.borderColor = 'var(--gold-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
            >DÉMARRER LE QUIZ</button>
            <button
              onClick={() => navigate('/cars')}
              style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,.7)', padding: '1rem 2.6rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .2s, border-color .2s', borderRadius: '50px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(193,123,90,.8)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.7)'; }}
            >CATALOGUE</button>
          </div>
        </div>

        {/* By Radia — bas-droite */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(1rem,3vh,2rem)',
          right: 0,
          background: 'linear-gradient(to right, transparent, rgba(42,31,18,.92) 25%)',
          padding: 'clamp(0.8rem,2vh,1.2rem) clamp(1.5rem,4vw,3rem) clamp(0.8rem,2vh,1.2rem) clamp(3rem,8vw,6rem)',
        }}>
          <p style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(2rem,4.5vw,3.5rem)',
            fontWeight: 700,
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #ffffff 0%, #E8D5C4 40%, #C17B5A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            By Radia
          </p>
        </div>

      </section>

      {/* ── SÉPARATEUR ── */}
      <div style={{ background: 'var(--bg)', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
          Nos véhicules
        </p>
        <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
      </div>

      {/* ── PHOTO MARQUEE ── */}
      {(() => {
        const marquee20 = CARS.filter(c => c.photo_url).slice(0, 20);
        const tiles = [...marquee20, ...marquee20];
        return (
          <div style={{ background: 'transparent', padding: '1rem 0', overflow: 'hidden' }}>
            <div className="marquee-track">
              {tiles.map((car, i) => (
                <div key={i} style={{ flexShrink: 0, width: '260px', height: '150px', marginRight: '0.5rem' }}>
                  <img
                    src={car.photo_url}
                    alt={`${car.make} ${car.model}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── HOW IT WORKS — spotlight carousel ── */}
      <section id="how" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(42,31,18,.08)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4.5rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Comment ça marche</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          {/* Cards */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', minHeight: '380px' }}>
            {STEPS.map((s, i) => {
              const on = i === activeStep;
              return (
                <div key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    flexGrow: on ? 2.5 : 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    borderRadius: '22px',
                    overflow: 'hidden',
                    cursor: on ? 'default' : 'pointer',
                    opacity: on ? 1 : 0.48,
                    boxShadow: on ? '0 24px 64px rgba(42,31,18,.16)' : 'none',
                    border: `1px solid ${on ? 'rgba(193,123,90,.32)' : 'rgba(193,123,90,.1)'}`,
                    background: 'var(--bg-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'flex-grow .78s cubic-bezier(.4,0,.2,1), opacity .78s, box-shadow .78s, border-color .78s',
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', height: '210px', flexShrink: 0, overflow: 'hidden' }}>
                    <img src={s.img} alt={s.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .9s ease' }}
                      onMouseEnter={e => { if (on) e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-2) 0%, transparent 55%)' }} />
                    <span style={{ position: 'absolute', top: '1rem', left: '1.25rem', fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 700, color: on ? 'var(--gold)' : 'rgba(193,123,90,.5)', transition: 'color .5s' }}>{s.n}</span>
                  </div>

                  {/* Text */}
                  <div style={{ padding: '1.5rem 1.75rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: 'var(--serif-display)',
                      fontSize: on ? '1.55rem' : '1rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      lineHeight: 1.1,
                      marginBottom: '.65rem',
                      transition: 'font-size .78s cubic-bezier(.4,0,.2,1)',
                      overflow: 'hidden',
                      textOverflow: on ? 'clip' : 'ellipsis',
                      whiteSpace: on ? 'normal' : 'nowrap',
                    }}>{s.title}</h3>

                    <div style={{ overflow: 'hidden', maxHeight: on ? '100px' : '0', opacity: on ? 1 : 0, transition: 'max-height .6s .12s cubic-bezier(.4,0,.2,1), opacity .5s .18s' }}>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ink-mute)', lineHeight: 2 }}>{s.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicateurs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2.5rem' }}>
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)} style={{
                width: activeStep === i ? '2.2rem' : '6px',
                height: '5px',
                borderRadius: '3px',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: activeStep === i ? 'var(--gold)' : 'rgba(193,123,90,.25)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'width .45s cubic-bezier(.4,0,.2,1), background .45s',
              }}>
                {activeStep === i && (
                  <span key={activeStep} style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(255,255,255,.35)',
                    transformOrigin: 'left',
                    animation: 'fillBar 4.2s linear forwards',
                  }} />
                )}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── QUIZ PREVIEW ── */}
      <section id="quiz" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(42,31,18,.08)', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div style={{ maxWidth: '600px' }}>
            <div className="reveal">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Le quiz</span>
                <div style={{ flex: 1, height: '1px', background: copper }} />
              </div>

              <h2 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2.8rem,5vw,5rem)', lineHeight: .88, letterSpacing: '-.04em', color: 'var(--ink)', marginBottom: '2rem' }}>
                Des questions<br /><span style={{ color: 'var(--gold)' }}>qui comptent.</span>
              </h2>

              <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ink-mute)', lineHeight: 2, maxWidth: '400px', marginBottom: '2.5rem' }}>
                Chaque réponse affine l'algorithme. En 10 questions, le système en sait plus sur vos besoins qu'un vendeur en deux heures.
              </p>

              <button
                onClick={() => navigate('/quiz')}
                style={{ background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '.9rem 2rem', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.75rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.7rem', borderRadius: '50px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
              >
                Commencer <span>→</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(42,31,18,.08)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '6rem' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Fonctionnalités</span>
            <div style={{ flex: 1, height: '1px', background: copper }} />
          </div>

          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="slide-left"
              style={{ '--slide-delay': `${i * 0.07}s`, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(2.5rem,5vw,5rem)', alignItems: 'center', padding: '3.5rem 0', borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(42,31,18,.06)' : 'none' }}
            >
              {/* Photo */}
              <div style={{ borderRadius: '18px', overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}>
                <img
                  src={f.img}
                  alt={f.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .7s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              {/* Texte */}
              <div style={{ paddingLeft: 'clamp(0px,2vw,1.5rem)' }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.1rem' }}>
                  {f.label}
                </p>
                <h3 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(2rem,3.2vw,2.8rem)', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', marginBottom: '1.4rem' }}>
                  {f.title}
                </h3>
                <div style={{ width: '32px', height: '1px', background: 'var(--gold)', marginBottom: '1.4rem' }} />
                <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', lineHeight: 2, maxWidth: '340px' }}>
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAR SHOWCASE ── */}
      <section style={{ padding: '9rem 5vw', borderBottom: '1px solid rgba(42,31,18,.08)', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Quelques modèles</span>
              <div style={{ width: '60px', height: '1px', background: copper }} />
            </div>
            <Link to="/cars" style={{ fontFamily: 'var(--sans)', fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: '.5rem' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-mute)'}
            >Voir les {CARS.length} modèles →</Link>
          </div>

          {(() => {
            const CAT_LABEL = { eco: 'Écologique', luxury: 'Luxe', practical: 'Pratique', performance: 'Performance' };
            const pick = (cat, n) => CARS.filter(c => c.photo_url && c.category === cat).slice(0, n);
            const showcase = [
              ...pick('eco', 2),
              ...pick('practical', 2),
              ...pick('luxury', 2),
              ...pick('performance', 2),
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {showcase.map(car => (
                  <Link key={car.id} to={`/cars/${car.id}`} style={{ display: 'block', background: 'var(--bg)', border: '1px solid rgba(193,123,90,.15)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color .25s, transform .25s, box-shadow .25s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(193,123,90,.4)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(193,123,90,.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(193,123,90,.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: '160px', overflow: 'hidden', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={car.photo_url} alt={`${car.make} ${car.model}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '8px', transition: 'transform .5s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                    <div style={{ padding: '1.1rem 1.4rem' }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', background: 'rgba(193,123,90,.1)', padding: '2px 8px', borderRadius: '20px' }}>
                        {CAT_LABEL[car.category] || car.category}
                      </span>
                      <h3 style={{ fontFamily: 'var(--serif-display)', fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1.15, marginTop: '.5rem', marginBottom: '.4rem' }}>{car.make} {car.model}</h3>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--gold)', fontWeight: 700 }}>
                        {car.price_eur ? `${Math.round(car.price_eur * 10.8).toLocaleString('fr-FR')} DH` : 'Sur demande'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })()}
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
            style={{ background: '#ffffff', color: 'var(--gold)', border: 'none', padding: '1.2rem 3.2rem', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, whiteSpace: 'nowrap', borderRadius: '50px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            Démarrer le quiz <span style={{ fontSize: '1rem' }}>→</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '2rem 3.5rem', borderTop: '1px solid rgba(30,58,138,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
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
