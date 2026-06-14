import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

export default function Quiz({ onComplete }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');   // intro | asking | thinking | error
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [leadingCar, setLeadingCar] = useState(null);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(false);
  const [thinkLabel, setThinkLabel] = useState('');
  const submitting = useRef(false);

  async function startQuiz() {
    setPhase('thinking');
    setThinkLabel('Initialisation');
    try {
      const res = await axios.post(`${API}/api/quiz/start`);
      setSessionId(res.data.sessionId);
      setQuestion(res.data.question);
      setConfidence(0);
      setVisible(false);
      setPhase('asking');
      requestAnimationFrame(() => setVisible(true));
    } catch { setPhase('error'); }
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
    try {
      const res = await axios.post(`${API}/api/quiz/answer`, { sessionId, questionId: question.id, answerIndex });
      setConfidence(res.data.confidence || 0);
      if (res.data.leadingCar) setLeadingCar(res.data.leadingCar);
      if (res.data.done) {
        setThinkLabel('Résultats trouvés');
        await delay(600);
        onComplete({ top3: res.data.top3, scores: {} });
        navigate('/results');
        return;
      }
      await delay(700);
      setSelected(null);
      setQuestion(res.data.question);
      submitting.current = false;
      setPhase('asking');
      requestAnimationFrame(() => setVisible(true));
    } catch {
      submitting.current = false;
      setPhase('asking');
      setVisible(true);
    }
  }

  if (phase === 'intro')    return <Intro onStart={startQuiz} />;
  if (phase === 'thinking') return <Thinking label={thinkLabel} confidence={confidence} leadingCar={leadingCar} />;
  if (phase === 'error')    return <ErrorScreen onRetry={startQuiz} />;
  return <QuestionCard question={question} confidence={confidence} leadingCar={leadingCar} selected={selected} visible={visible} onAnswer={handleAnswer} />;
}

/* ── INTRO ── */
function Intro({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', maxWidth: '480px', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', fontSize: '.75rem', letterSpacing: '.12em', textTransform: 'uppercase', padding: '.4rem 1rem', borderRadius: '50px', marginBottom: '2rem' }}>
          <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
          Conseil automobile · IA bayésienne
        </div>

        <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(3rem,8vw,5.5rem)', lineHeight: 1.0, letterSpacing: '-.04em', marginBottom: '1.5rem' }}>
          Auto<span style={{ color: 'var(--gold)' }}>Assist</span>
        </h1>

        <div style={{ width: 40, height: 1, background: 'var(--gold)', margin: '0 auto 1.5rem' }} />

        <p style={{ fontFamily: 'var(--sans)', fontSize: '1rem', color: 'var(--ink-mute)', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300 }}>
          Un système adaptatif déduira votre véhicule idéal<br />
          question par question, par inférence bayésienne.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem' }}>
          {[{ label: 'Adaptatif', sub: 'Bayésien' }, { label: '15 – 30', sub: 'Questions' }, { label: 'Top 3', sub: 'Sur mesure' }].map(({ label, sub }) => (
            <div key={label} style={{ background: 'var(--bg-2)', padding: '1.25rem .5rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--serif-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1, marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{sub}</p>
            </div>
          ))}
        </div>

        <button onClick={onStart} className="btn-primary" style={{ fontSize: '1rem', padding: '.9rem 2.5rem' }}>
          Commencer l'analyse →
        </button>
      </div>
    </div>
  );
}

/* ── THINKING ── */
function Thinking({ label, confidence, leadingCar }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
        <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: 'var(--gold)', animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--gold)', animation: 'lx-pulse 1.4s ease-in-out infinite', position: 'relative', zIndex: 1 }} />
      </div>

      <p style={{ fontFamily: 'var(--sans)', fontSize: '.85rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '.5rem' }}>
        {label}{dots}
      </p>
      <p style={{ fontSize: '.75rem', letterSpacing: '.15em', color: 'var(--ink-mute)', opacity: .5 }}>Calcul des probabilités</p>

      {confidence > 0 && (
        <div style={{ marginTop: '3rem', width: '200px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Confiance</span>
            <span style={{ fontFamily: 'var(--serif-display)', fontSize: '.9rem', color: 'var(--gold)' }}>{confidence}%</span>
          </div>
          <div style={{ height: '2px', background: 'rgba(245,240,232,.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${confidence}%`, background: 'var(--gold)', borderRadius: '2px', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>
      )}

      {leadingCar && confidence > 10 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--line)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: '6px' }}>En tête</p>
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--gold-2)' }}>
            {leadingCar.make} {leadingCar.model}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── QUESTION CARD ── */
function QuestionCard({ question, confidence, leadingCar, selected, visible, onAnswer }) {
  if (!question) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse at center top, rgba(201,168,76,.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--line)', background: 'rgba(10,11,15,.9)', backdropFilter: 'blur(16px)', padding: '.875rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '.72rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
              Question{' '}
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--serif-display)', fontSize: '1rem', fontWeight: 800, letterSpacing: 'normal' }}>
                {question.number}
              </span>
            </span>
            <span style={{ fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
              {confidence > 0
                ? <><span style={{ color: 'var(--gold)', fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1rem', letterSpacing: 'normal' }}>{confidence}%</span>{' '}confiance</>
                : 'Déduction en cours'}
            </span>
          </div>
          <div style={{ height: '2px', background: 'rgba(245,240,232,.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(confidence, 2)}%`, background: 'var(--gold)', borderRadius: '2px', transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          {leadingCar && confidence > 15 && (
            <p style={{ fontSize: '.72rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: '8px' }}>
              En tête :{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{leadingCar.make} {leadingCar.model}</span>
            </p>
          )}
        </div>
      </div>

      {/* Question + answers */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '640px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity .3s ease, transform .3s ease' }}>
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', fontFamily: 'var(--serif-display)', fontSize: 'clamp(80px,18vw,140px)', color: 'var(--gold)', opacity: .04, lineHeight: 1, userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap', fontWeight: 800 }}>
              {String(question.number).padStart(2, '0')}
            </span>
            <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.8rem)', lineHeight: 1.1, letterSpacing: '-.03em', position: 'relative' }}>
              {question.question}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {question.answers.map(answer => (
              <AnswerButton key={answer.index} answer={answer} isSelected={selected === answer.index} isDimmed={selected !== null && selected !== answer.index} disabled={selected !== null} onClick={() => onAnswer(answer.index)} />
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', opacity: .5, marginTop: '2.5rem' }}>
            Sélectionnez une réponse pour continuer
          </p>
        </div>
      </div>
    </div>
  );
}

function AnswerButton({ answer, isSelected, isDimmed, disabled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const LETTERS = ['A', 'B', 'C', 'D'];

  const borderColor = isSelected ? 'var(--gold)' : hovered && !disabled ? 'rgba(201,168,76,.4)' : 'rgba(245,240,232,.08)';
  const bg = isSelected ? 'rgba(201,168,76,.1)' : hovered && !disabled ? 'rgba(201,168,76,.04)' : 'rgba(245,240,232,.03)';

  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', textAlign: 'left', border: `1px solid ${borderColor}`, background: bg, padding: '.875rem 1.25rem', borderRadius: '10px', opacity: isDimmed ? .25 : 1, transition: 'border-color .25s, background .25s, opacity .25s', display: 'flex', alignItems: 'center', gap: '1rem' }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: isSelected ? 'var(--gold)' : 'var(--ink-mute)', fontWeight: 700, minWidth: '20px', transition: 'color .25s' }}>
        {LETTERS[answer.index]}
      </span>
      <div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.9rem', fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--ink)' : 'var(--ink-soft)', lineHeight: 1.4, transition: 'color .25s' }}>
          {answer.text}
        </p>
        {answer.sub && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.78rem', color: 'var(--ink-mute)', marginTop: '2px', lineHeight: 1.4 }}>
            {answer.sub}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── ERROR ── */
function ErrorScreen({ onRetry }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem' }}>Connexion impossible</p>
        <p style={{ fontSize: '.9rem', color: 'var(--ink-mute)', lineHeight: 1.6, marginBottom: '2.5rem' }}>Vérifiez que le serveur est actif sur le port 3001.</p>
        <button onClick={onRetry} className="btn-outline">Réessayer</button>
      </div>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
