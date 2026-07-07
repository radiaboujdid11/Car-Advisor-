import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARS } from '../data/cars';
import {
  createSession, getBestQuestion, applyAnswer, isDone,
  getTopCars, displayConfidence, formatQuestion, getMatchReason
} from '../engine/quiz';

export default function Quiz({ onComplete }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');   // intro | asking | thinking
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [leadingCar, setLeadingCar] = useState(null);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(false);
  const [thinkLabel, setThinkLabel] = useState('');
  const [topProbs, setTopProbs] = useState([]);
  const submitting = useRef(false);
  const rawQuestionRef = useRef(null);

  async function startQuiz() {
    setPhase('thinking');
    setThinkLabel('Initialisation');
    await delay(400);
    const s = createSession(CARS);
    const rawQ = getBestQuestion(s, CARS);
    rawQuestionRef.current = rawQ;
    setSession(s);
    setQuestion(formatQuestion(rawQ, 1));
    setConfidence(0);
    setLeadingCar(null);
    setSelected(null);
    setVisible(false);
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  async function handleAnswer(answerIndex) {
    if (submitting.current) return;
    submitting.current = true;
    setSelected(answerIndex);
    await delay(420);
    setVisible(false);
    await delay(220);
    setPhase('thinking');
    setThinkLabel('Analyse en cours');

    const s = {
      ...session,
      carProbs: { ...session.carProbs },
      askedIds: new Set(session.askedIds),
      answers: [...session.answers]
    };
    applyAnswer(s, rawQuestionRef.current, answerIndex, CARS);

    const conf = displayConfidence(s, CARS);
    setConfidence(conf);
    const top5 = getTopCars(s, CARS, 5);
    if (top5.length > 0) setLeadingCar({ make: top5[0].make, model: top5[0].model });
    setTopProbs(top5.map(c => ({ make: c.make, model: c.model, prob: c._prob })));

    if (isDone(s, CARS)) {
      setThinkLabel('Résultats trouvés');
      await delay(600);
      const top3 = getTopCars(s, CARS, 3).map(car => ({
        ...car,
        matchScore: Math.min(Math.round(52 + car._prob * 140), 99),
        matchReason: getMatchReason(car)
      }));
      setSession(s);
      onComplete({ top3, scores: {} });
      navigate('/results');
      return;
    }

    await delay(2000);

    const rawQ = getBestQuestion(s, CARS);
    rawQuestionRef.current = rawQ;
    setSelected(null);
    setQuestion(formatQuestion(rawQ, s.askedIds.size + 1));
    setSession(s);
    submitting.current = false;
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  if (phase === 'intro')    return <Intro onStart={startQuiz} />;
  if (phase === 'thinking') return <Thinking label={thinkLabel} confidence={confidence} leadingCar={leadingCar} topProbs={topProbs} />;
  return <QuestionCard question={question} confidence={confidence} leadingCar={leadingCar} selected={selected} visible={visible} onAnswer={handleAnswer} topProbs={topProbs} />;
}

/* ── INTRO ── */
function Intro({ onStart }) {
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>

      {/* Photo plein écran — légèrement floutée */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/sunset.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(6px)',
        transform: 'scale(1.08)',
        animation: 'slowZoom 22s ease-in-out infinite alternate',
      }} />

      {/* Scrim sombre — Daily pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(18,10,4,.52)',
      }} />

      {/* Brand mark — top center */}
      <div style={{
        position: 'absolute',
        top: 'clamp(1.8rem,4vh,3rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: '1.15rem', color: '#fff', letterSpacing: '-.01em', lineHeight: 1 }}>
          AutoAssist
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginTop: '.35rem' }}>
          Conseil Automobile
        </p>
      </div>

      {/* Contenu centré */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 2rem', maxWidth: '860px' }}>

        {/* Titre mixte italic + roman — exactement comme Daily */}
        <h1 style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(3.2rem,8.5vw,6.5rem)',
          lineHeight: 1.05,
          letterSpacing: '-.02em',
          color: '#fff',
          marginBottom: '1.5rem',
          textWrap: 'balance',
        }}>
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Prêt </em>à trouver
          <br />
          <span style={{ fontStyle: 'normal', fontWeight: 700 }}>ta voiture idéale ?</span>
        </h1>

        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: '1.05rem',
          color: 'rgba(255,255,255,.72)',
          lineHeight: 1.6,
          marginBottom: '2.8rem',
          fontWeight: 300,
          letterSpacing: '.01em',
        }}>
          Entre 15 et 30 questions adaptatives. Un résultat sur mesure.
        </p>

        {/* CTA blanc arrondi */}
        <button
          onClick={onStart}
          style={{
            background: '#ffffff',
            color: '#2A1F12',
            border: 'none',
            padding: '.95rem 3rem',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            fontSize: '.9rem',
            letterSpacing: '.04em',
            cursor: 'pointer',
            borderRadius: '50px',
            transition: 'background .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0E8DE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
        >
          Commencer l'analyse →
        </button>
      </div>

    </div>
  );
}

/* ── BAYES PANEL ── */
function BayesPanel({ topProbs }) {
  if (!topProbs || topProbs.length === 0) return null;
  const maxProb = topProbs[0].prob || 1;

  return (
    <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(232,66,16,.18)', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.2rem' }}>
        <span style={{ width: 5, height: 5, background: '#E84210', borderRadius: '50%', flexShrink: 0, animation: 'pulse-dot 1.5s infinite' }} />
        <p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(232,66,16,.7)', fontFamily: 'var(--sans)' }}>
          Probabilités bayésiennes
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {topProbs.map((car, i) => {
          const pct = (car.prob * 100).toFixed(1);
          const barWidth = (car.prob / maxProb) * 100;
          return (
            <div key={`${car.make}-${car.model}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '.78rem', color: i === 0 ? '#F5EDE2' : 'rgba(245,237,226,.45)', fontFamily: 'var(--sans)', fontWeight: i === 0 ? 500 : 400 }}>
                  {i === 0 && <span style={{ color: '#E84210', marginRight: '6px', fontSize: '.6rem' }}>▲</span>}
                  {car.make} {car.model}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: i === 0 ? '#E84210' : 'rgba(245,237,226,.3)', letterSpacing: '.05em' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(245,237,226,.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barWidth}%`, background: i === 0 ? '#E84210' : 'rgba(245,237,226,.2)', transition: 'width .9s cubic-bezier(.4,0,.2,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '.58rem', color: 'rgba(245,237,226,.2)', marginTop: '1rem', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>
        Théorème de Bayes — mise à jour en direct
      </p>
    </div>
  );
}

/* ── THINKING ── */
function Thinking({ label, confidence, leadingCar, topProbs }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#140C06', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
        <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#E84210', animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#E84210', animation: 'lx-pulse 1.4s ease-in-out infinite', position: 'relative', zIndex: 1 }} />
      </div>

      <p style={{ fontFamily: 'var(--sans)', fontSize: '.8rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(245,237,226,.5)', marginBottom: '.5rem' }}>
        {label}{dots}
      </p>
      <p style={{ fontSize: '.68rem', letterSpacing: '.15em', color: 'rgba(245,237,226,.25)', textTransform: 'uppercase' }}>Calcul des probabilités</p>

      {confidence > 0 && (
        <div style={{ marginTop: '3rem', width: '220px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '.68rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,226,.35)' }}>Confiance</span>
            <span style={{ fontFamily: 'var(--serif-display)', fontSize: '1rem', color: '#E84210', fontWeight: 700 }}>{confidence}%</span>
          </div>
          <div style={{ height: '1px', background: 'rgba(245,237,226,.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${confidence}%`, background: '#E84210', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>
      )}

      {leadingCar && confidence > 10 && (
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(245,237,226,.25)', marginBottom: '8px' }}>En tête</p>
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.4rem', color: '#F5EDE2' }}>
            {leadingCar.make} <span style={{ color: '#E84210' }}>{leadingCar.model}</span>
          </p>
        </div>
      )}

      {topProbs.length > 0 && (
        <div style={{ marginTop: '2.5rem', width: '320px', maxWidth: '90vw' }}>
          <BayesPanel topProbs={topProbs} />
        </div>
      )}
    </div>
  );
}

/* ── QUESTION CARD ── */
function QuestionCard({ question, confidence, leadingCar, selected, visible, onAnswer, topProbs }) {
  if (!question) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#140C06', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '900px', height: '500px', background: 'radial-gradient(ellipse at center top, rgba(232,66,16,.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(20,12,6,.96)', backdropFilter: 'blur(20px)', padding: '1rem 2.5rem' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '.68rem', letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,237,226,.35)' }}>
              Question{' '}
              <span style={{ color: '#E84210', fontFamily: 'var(--serif-display)', fontSize: '1rem', fontWeight: 800, letterSpacing: 'normal' }}>
                {question.number}
              </span>
            </span>
            <span style={{ fontSize: '.68rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,237,226,.35)' }}>
              {confidence > 0
                ? <><span style={{ color: '#E84210', fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1rem', letterSpacing: 'normal' }}>{confidence}%</span>{' '}confiance</>
                : 'Déduction en cours'}
            </span>
          </div>
          <div style={{ height: '1px', background: 'rgba(245,237,226,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(confidence, 2)}%`, background: '#E84210', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          {leadingCar && confidence > 15 && (
            <p style={{ fontSize: '.65rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,237,226,.28)', marginTop: '8px' }}>
              En tête :{' '}
              <span style={{ color: '#E84210' }}>{leadingCar.make} {leadingCar.model}</span>
            </p>
          )}
        </div>
      </div>

      {/* Question + answers */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '620px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity .35s ease, transform .35s ease' }}>

          {/* Ghost number */}
          <span style={{ display: 'block', fontFamily: 'var(--serif-display)', fontSize: 'clamp(60px,14vw,110px)', color: '#E84210', opacity: .07, lineHeight: 1, userSelect: 'none', pointerEvents: 'none', fontWeight: 800, marginBottom: '-1.5rem' }}>
            {String(question.number).padStart(2, '0')}
          </span>

          {/* Question */}
          <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(1.8rem,4.5vw,3rem)', lineHeight: 1.1, letterSpacing: '-.03em', color: '#F5EDE2', marginBottom: '3.5rem' }}>
            {question.question}
          </h2>

          {/* Answers — texte pur, aucune bordure */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {question.answers.map(answer => (
              <AnswerButton key={answer.index} answer={answer} isSelected={selected === answer.index} isDimmed={selected !== null && selected !== answer.index} disabled={selected !== null} onClick={() => onAnswer(answer.index)} />
            ))}
          </div>

          <p style={{ fontSize: '.65rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(245,237,226,.2)', marginTop: '3rem' }}>
            Sélectionnez une réponse pour continuer
          </p>

          <BayesPanel topProbs={topProbs} />

        </div>
      </div>
    </div>
  );
}

function AnswerButton({ answer, isSelected, isDimmed, disabled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const LETTERS = ['A', 'B', 'C', 'D'];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        border: 'none',
        background: 'none',
        padding: '1.15rem 0',
        borderBottom: '1px solid rgba(245,237,226,.07)',
        opacity: isDimmed ? .2 : 1,
        transition: 'opacity .25s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1.6rem',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '.65rem',
        letterSpacing: '.25em',
        textTransform: 'uppercase',
        color: isSelected ? '#E84210' : hovered && !disabled ? '#E84210' : 'rgba(245,237,226,.28)',
        fontWeight: 600,
        minWidth: '16px',
        paddingTop: '5px',
        flexShrink: 0,
        transition: 'color .2s',
      }}>
        {LETTERS[answer.index]}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(1.05rem,2.5vw,1.35rem)',
          fontWeight: isSelected ? 700 : 400,
          color: isSelected ? '#F5EDE2' : hovered && !disabled ? '#F5EDE2' : 'rgba(245,237,226,.65)',
          lineHeight: 1.35,
          letterSpacing: '-.01em',
          transition: 'color .2s',
        }}>
          {answer.text}
        </p>
        {answer.sub && (
          <p style={{
            fontFamily: 'var(--sans)',
            fontSize: '.75rem',
            color: isSelected ? 'rgba(232,66,16,.65)' : 'rgba(245,237,226,.28)',
            marginTop: '5px',
            lineHeight: 1.5,
            letterSpacing: '.01em',
            transition: 'color .2s',
          }}>
            {answer.sub}
          </p>
        )}
      </div>
      {isSelected && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#E84210',
          flexShrink: 0,
          marginTop: '8px',
          boxShadow: '0 0 10px rgba(232,66,16,.6)',
        }} />
      )}
    </button>
  );
}


function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
