import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARS } from '../data/cars';
import {
  createSession, getBestQuestion, applyAnswer, isDone,
  getTopCars, displayConfidence, formatQuestion, getMatchReason
} from '../engine/quiz';

/* ── Design tokens — palette du site ── */
const C = {
  bg:       'var(--bg)',
  panel:    'var(--bg-2)',
  surface:  'var(--bg)',
  surface2: 'var(--bg-2)',
  text:     'var(--ink)',
  mute:     'var(--ink-mute)',
  faint:    'var(--ink-mute)',
  accent:   'var(--gold)',
  gold:     'var(--gold-2)',
  border:   'var(--line)',
  borderHi: 'var(--gold)',
};

const DEDUCTION_BANK = {
  luxury:      ['Préférence pour les intérieurs raffinés','Attrait pour les finitions premium','Sensibilité au prestige','Confort identifié comme prioritaire','Usage représentatif valorisé'],
  performance: ['Attrait pour la puissance moteur','Conduite dynamique valorisée','Performance comme critère clé','Profil sportif confirmé','Réactivité recherchée'],
  eco:         ["Conscience environnementale détectée","Économie d'usage valorisée","Approche rationnelle confirmée","Efficience comme priorité","Impact réduit recherché"],
  practical:   ["Besoin d'espace identifié","Polyvalence recherchée","Usage familial probable","Praticité avant prestige","Modularité valorisée"],
};

const PERSONALITY = {
  luxury:      ['Connaisseur','Executive','Raffiné'],
  performance: ['Sportif','Passionné','Dynamique'],
  eco:         ['Raisonné','Conscient','Économe'],
  practical:   ['Polyvalent','Familial','Pragmatique'],
};

const BUDGET_MAP = {
  luxury:      '600 000 – 1 200 000 DH',
  performance: '400 000 – 900 000 DH',
  eco:         '150 000 – 350 000 DH',
  practical:   '200 000 – 500 000 DH',
};

const AI_INSIGHTS = [
  { at: 5,  msg: 'Vos premiers choix révèlent une personnalité affirmée…' },
  { at: 9,  msg: 'La cohérence de vos réponses est remarquable. Le profil se précise.' },
  { at: 14, msg: 'Nous affinons votre correspondance. Elle s\'annonce excellente.' },
];

const REVEAL_STEPS = [
  "Vérification des coûts d'entretien…",
  'Comparaison de la fiabilité…',
  'Analyse du style de vie…',
  'Évaluation du confort…',
  `Comparaison de ${CARS.length} véhicules…`,
  'Recherche de la correspondance parfaite…',
];

const INTERIM_Q = 15;
const REFINE_Q  = 10;

/* ─────────────────────────────────────────────── */
export default function Quiz({ onComplete }) {
  const navigate = useNavigate();

  const [phase, setPhase]               = useState('intro');
  const [session, setSession]           = useState(null);
  const [question, setQuestion]         = useState(null);
  const [confidence, setConfidence]     = useState(0);
  const [leadingCar, setLeadingCar]     = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const submittingRef = useRef(false);
  const [visible, setVisible]           = useState(false);
  const [topProbs, setTopProbs]         = useState([]);
  const [deductions, setDeductions]     = useState([]);
  const [aiInsight, setAiInsight]       = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [interimDone, setInterimDone]   = useState(false);
  const [refineLeft, setRefineLeft]     = useState(0);
  const [finalTop3, setFinalTop3]       = useState(null);
  const [excludedIds, setExcludedIds]   = useState(new Set());

  const rawQuestionRef = useRef(null);

  async function startQuiz() {
    setPhase('init');
    await delay(500);
    const s = createSession(CARS);
    const rawQ = getBestQuestion(s, CARS);
    rawQuestionRef.current = rawQ;
    setSession(s);
    setQuestion(formatQuestion(rawQ, 1));
    setConfidence(0);
    setLeadingCar(null);
    setPendingAnswer(null);
    submittingRef.current = false;
    setDeductions([]);
    setAnsweredCount(0);
    setInterimDone(false);
    setRefineLeft(0);
    setVisible(false);
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  async function handleAnswer(answerIndex) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPendingAnswer(answerIndex);
    setSubmitting(true);
    setVisible(false);
    await delay(220);

    const s = {
      ...session,
      carProbs: { ...session.carProbs },
      askedIds: new Set(session.askedIds),
      answers:  [...session.answers],
    };
    applyAnswer(s, rawQuestionRef.current, answerIndex, CARS);

    const conf = displayConfidence(s, CARS);
    const top5 = getTopCars(s, CARS, 5);
    const top  = top5[0];

    setConfidence(conf);
    if (top) setLeadingCar({ make: top.make, model: top.model, category: top.category });
    setTopProbs(top5.map(c => ({ make: c.make, model: c.model, prob: c._prob, category: c.category })));

    if (top) {
      const cat  = top.category || 'practical';
      const bank = DEDUCTION_BANK[cat] || DEDUCTION_BANK.practical;
      setDeductions(prev => [bank[s.askedIds.size % bank.length], ...prev].slice(0, 7));
    }

    const newCount = answeredCount + 1;
    setAnsweredCount(newCount);
    setSession(s);

    /* ── Interim proposal after INTERIM_Q questions ── */
    if (!interimDone && s.askedIds.size >= INTERIM_Q) {
      const top3 = buildTop3(s);
      setFinalTop3(top3);
      setInterimDone(true);
      setPendingAnswer(null);
      setSubmitting(false);
      submittingRef.current = false;
      setPhase('interim');
      return;
    }

    /* ── In refinement mode: count down ── */
    if (refineLeft > 0) {
      const remaining = refineLeft - 1;
      setRefineLeft(remaining);
      if (remaining === 0 || isDone(s, CARS)) {
        const top3 = buildTop3(s);
        setFinalTop3(top3);
        setPendingAnswer(null);
        setSubmitting(false);
        submittingRef.current = false;
        setPhase('revealing');
        return;
      }
    } else if (isDone(s, CARS)) {
      const top3 = buildTop3(s);
      setFinalTop3(top3);
      setPendingAnswer(null);
      setSubmitting(false);
      setPhase('revealing');
      return;
    }

    /* ── AI Insight ── */
    const insight = AI_INSIGHTS.find(i => i.at === newCount);
    if (insight && conf > 20) {
      setAiInsight(insight.msg);
      setPendingAnswer(null);
      setSubmitting(false);
      submittingRef.current = false;
      setPhase('ai-comment');
      return;
    }

    /* ── Next question ── */
    const rawQ = getBestQuestion(s, CARS);
    rawQuestionRef.current = rawQ;
    setPendingAnswer(null);
    setQuestion(formatQuestion(rawQ, s.askedIds.size + 1));
    setSubmitting(false);
    submittingRef.current = false;
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  function buildTop3(s, excluded = excludedIds) {
    return getTopCars(s, CARS, 3 + excluded.size + 2)
      .filter(car => !excluded.has(car.id))
      .slice(0, 3)
      .map(car => ({
        ...car,
        matchScore: Math.min(Math.round(52 + car._prob * 140), 99),
        matchReason: getMatchReason(car),
      }));
  }

  function excludeCar(carId) {
    setExcludedIds(prev => {
      const next = new Set(prev);
      next.add(carId);
      return next;
    });
    setFinalTop3(prev => prev ? prev.filter(c => c.id !== carId) : prev);
  }

  function resumeFromInsight() {
    setAiInsight(null);
    setPendingAnswer(null);
    setVisible(false);
    const rawQ = getBestQuestion(session, CARS);
    rawQuestionRef.current = rawQ;
    setQuestion(formatQuestion(rawQ, session.askedIds.size + 1));
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  function goToResults() {
    onComplete({ top3: finalTop3, scores: {} });
    navigate('/results');
  }

  function startRefinement() {
    setRefineLeft(REFINE_Q);
    setPendingAnswer(null);
    setVisible(false);
    const rawQ = getBestQuestion(session, CARS);
    rawQuestionRef.current = rawQ;
    setQuestion(formatQuestion(rawQ, session.askedIds.size + 1));
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  /* ── Routing ── */
  if (phase === 'intro')    return <Intro onStart={startQuiz} />;
  if (phase === 'init')     return <InitScreen />;
  if (phase === 'revealing') return <FinalReveal onDone={goToResults} />;

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', background: C.bg, position: 'relative' }}>

      {/* Video background — right panel only */}
      <video
        autoPlay muted loop playsInline
        style={{ position: 'absolute', right: 0, top: 0, width: 'calc(100% - 330px)', height: '100%', objectFit: 'cover', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}
      >
        <source src="/car-bg.mp4" type="video/mp4" />
      </video>

      <LeftPanel
        confidence={confidence}
        leadingCar={leadingCar}
        topProbs={topProbs}
        deductions={deductions}
        refineLeft={refineLeft}
      />
      <div style={{ flex: 1, overflow: 'hidden auto', position: 'relative', zIndex: 1 }}>
        {phase === 'asking' && (
          <QuestionCard
            question={question}
            pendingAnswer={pendingAnswer}
            visible={visible}
            submitting={submitting}
            confidence={confidence}
            refineLeft={refineLeft}
            onAnswer={handleAnswer}
          />
        )}
        {phase === 'ai-comment' && (
          <AIComment message={aiInsight} leadingCar={leadingCar} onContinue={resumeFromInsight} />
        )}
        {phase === 'interim' && (
          <InterimProposal
            top3={finalTop3}
            confidence={confidence}
            excludedIds={excludedIds}
            onExclude={excludeCar}
            onAccept={goToResults}
            onRefine={startRefinement}
          />
        )}
      </div>
    </div>
  );
}

/* ── INTRO ── */
function Intro({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/sunset.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(6px)', transform: 'scale(1.08)', animation: 'slowZoom 22s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,9,6,.65)' }} />
      <div style={{ position: 'absolute', top: 'clamp(1.8rem,4vh,3rem)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 1, whiteSpace: 'nowrap' }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 700, fontSize: '1.15rem', color: '#fff', letterSpacing: '-.01em' }}>AutoAssist</p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginTop: '.35rem' }}>Conseil Automobile</p>
      </div>
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 2rem', maxWidth: '860px' }}>
        <h1 style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(3.2rem,8.5vw,6.5rem)', lineHeight: 1.05, letterSpacing: '-.02em', color: '#fff', marginBottom: '1.5rem', textWrap: 'balance' }}>
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Prêt </em>à trouver<br />
          <span style={{ fontStyle: 'normal', fontWeight: 700 }}>ta voiture idéale ?</span>
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '1.05rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: '2.8rem', fontWeight: 300 }}>
          Entre 15 et 30 questions adaptatives. Un résultat sur mesure.
        </p>
        <button onClick={onStart}
          style={{ background: '#fff', color: '#2A1F12', border: 'none', padding: '.95rem 3rem', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.9rem', letterSpacing: '.04em', cursor: 'pointer', borderRadius: '50px', transition: 'background .2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0E8DE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
          Commencer l'analyse →
        </button>
      </div>
    </div>
  );
}

/* ── INIT SCREEN ── */
function InitScreen() {
  return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 10, height: 10, margin: '0 auto 1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.accent, animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.accent, position: 'relative', zIndex: 1 }} />
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.25em', textTransform: 'uppercase', color: C.mute }}>Initialisation de l'IA…</p>
      </div>
    </div>
  );
}

/* ── LEFT PANEL ── */
function LeftPanel({ confidence, leadingCar, topProbs, deductions, refineLeft }) {
  const top1 = topProbs[0];
  const top2 = topProbs[1];
  const top3 = topProbs[2];
  const cat  = top1?.category || 'practical';
  const tags = PERSONALITY[cat] || PERSONALITY.practical;
  const toScore = p => Math.min(Math.round(50 + (p || 0) * 140), 99);

  return (
    <div style={{ width: '330px', flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`, height: '100vh', overflowY: 'auto', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, flexShrink: 0, animation: 'pulse-dot 1.5s infinite' }} />
        <span style={{ fontFamily: 'var(--sans)', fontSize: '.54rem', letterSpacing: '.28em', textTransform: 'uppercase', color: C.accent }}>
          IA Analysis — En direct
        </span>
      </div>

      {/* Current match */}
      <div style={{ background: C.surface, borderRadius: '12px', padding: '1.2rem', border: `1px solid ${top1 ? C.borderHi : C.border}`, transition: 'border-color .5s' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint, marginBottom: '.65rem' }}>
          Correspondance actuelle
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {top1 ? (
              <>
                <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.1rem', color: C.text, lineHeight: 1.1 }}>{top1.make}</p>
                <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: '.9rem', color: C.mute, lineHeight: 1.1 }}>{top1.model}</p>
              </>
            ) : (
              <p style={{ fontFamily: 'var(--sans)', fontSize: '.7rem', color: C.faint }}>Analyse en cours…</p>
            )}
          </div>
          {top1 && (
            <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: '1.9rem', color: C.accent, lineHeight: 1, transition: 'all .6s' }}>
              {toScore(top1.prob)}<span style={{ fontSize: '.45em', color: C.mute }}>%</span>
            </p>
          )}
        </div>
      </div>

      {/* Alternatives */}
      {(top2 || top3) && (
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint, marginBottom: '.65rem' }}>Alternatives</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[top2, top3].filter(Boolean).map((car, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.72rem', color: C.mute }}>{car.make} {car.model}</span>
                <span style={{ fontFamily: 'var(--serif-display)', fontSize: '.85rem', color: C.gold }}>{toScore(car.prob)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint }}>Confiance</span>
          <span style={{ fontFamily: 'var(--serif-display)', fontSize: '.85rem', color: C.accent }}>{confidence}%</span>
        </div>
        <div style={{ height: '2px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${confidence}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.accent})`, borderRadius: '2px', transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>

      {/* Personality */}
      {confidence > 15 && (
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint, marginBottom: '.65rem' }}>Profil détecté</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--sans)', fontSize: '.63rem', letterSpacing: '.08em', color: C.accent, background: 'rgba(200,149,106,.1)', padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(200,149,106,.18)' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      {confidence > 25 && (
        <div style={{ padding: '.7rem .75rem', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.2em', textTransform: 'uppercase', color: C.faint, marginBottom: '4px' }}>Budget estimé</p>
          <p style={{ fontFamily: 'var(--serif-display)', fontSize: '.8rem', color: C.text }}>{BUDGET_MAP[cat]}</p>
        </div>
      )}

      {/* Refinement badge */}
      {refineLeft > 0 && (
        <div style={{ padding: '.6rem .75rem', background: 'rgba(200,149,106,.08)', borderRadius: '8px', border: '1px solid rgba(200,149,106,.2)' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.2em', textTransform: 'uppercase', color: C.accent, marginBottom: '3px' }}>Mode raffinement</p>
          <p style={{ fontFamily: 'var(--serif-display)', fontSize: '.95rem', color: C.text }}>{refineLeft} question{refineLeft > 1 ? 's' : ''} restante{refineLeft > 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Deduction log */}
      {deductions.length > 0 && (
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint, marginBottom: '.65rem' }}>Déductions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {deductions.map((d, i) => (
              <div key={`${d}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: Math.max(0.15, 1 - i * 0.13), transition: 'opacity .4s' }}>
                <span style={{ color: C.accent, fontSize: '.58rem', flexShrink: 0, marginTop: '2px' }}>✓</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', color: C.mute, lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem', marginTop: 'auto' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.52rem', letterSpacing: '.1em', color: C.faint, lineHeight: 1.7 }}>
          Analyse parmi {CARS.length} véhicules en temps réel
        </p>
      </div>
    </div>
  );
}

/* ── QUESTION CARD ── */
function QuestionCard({ question, pendingAnswer, visible, submitting, confidence, refineLeft, onAnswer }) {
  if (!question) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 3rem' }}>

      {/* Progress */}
      <div style={{ width: '100%', maxWidth: '560px', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '.54rem', letterSpacing: '.25em', textTransform: 'uppercase', color: C.faint }}>
            {refineLeft > 0 ? `Raffinement — ${refineLeft} restante${refineLeft > 1 ? 's' : ''}` : 'Analyse de compatibilité'}
          </span>
          <span style={{ fontFamily: 'var(--serif-display)', fontSize: '.8rem', color: C.accent }}>{confidence}%</span>
        </div>
        <div style={{ height: '1px', background: C.border, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(confidence, 2)}%`, background: C.accent, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>

      {/* Question + Answers */}
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '2rem', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)', transition: 'opacity .4s ease, transform .4s ease' }}>

        <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(1.7rem,3.8vw,2.6rem)', lineHeight: 1.12, letterSpacing: '-.03em', color: C.text, textAlign: 'center' }}>
          {question.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {question.answers.map(answer => (
            <AnswerCard
              key={answer.index}
              answer={answer}
              isSelected={pendingAnswer === answer.index}
              disabled={submitting}
              onClick={() => { if (!submitting) onAnswer(answer.index); }}
            />
          ))}
        </div>

        <p style={{ fontFamily: 'var(--sans)', fontSize: '.54rem', letterSpacing: '.2em', textTransform: 'uppercase', color: C.faint, textAlign: 'center' }}>
          Sélectionnez une réponse pour continuer
        </p>
      </div>
    </div>
  );
}

/* ── ANSWER CARD ── */
function AnswerCard({ answer, isSelected, disabled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const LETTERS = ['A', 'B', 'C', 'D'];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => { if (!disabled) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left',
        border: `1px solid ${isSelected ? C.borderHi : hovered ? 'rgba(210,175,130,.18)' : C.border}`,
        background: isSelected ? 'rgba(200,149,106,.1)' : hovered ? 'rgba(200,149,106,.04)' : C.surface,
        padding: '.95rem 1.2rem', borderRadius: '10px',
        opacity: 1,
        transition: 'all .25s cubic-bezier(.4,0,.2,1)',
        display: 'flex', alignItems: 'center', gap: '1rem',
        cursor: disabled ? 'default' : 'pointer',
        transform: isSelected ? 'scale(1.012)' : 'scale(1)',
        boxShadow: isSelected ? `0 0 0 1px ${C.accent}, 0 6px 28px rgba(200,149,106,.12)` : 'none',
      }}
    >
      <span style={{ fontFamily: 'var(--sans)', fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: isSelected ? C.accent : C.faint, fontWeight: 600, flexShrink: 0, width: '14px', transition: 'color .2s' }}>
        {LETTERS[answer.index]}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontSize: 'clamp(.95rem,2vw,1.1rem)', fontWeight: isSelected ? 600 : 400, color: isSelected ? C.text : hovered ? C.text : 'rgba(245,237,226,.78)', lineHeight: 1.3, letterSpacing: '-.01em', transition: 'color .2s' }}>
          {answer.text}
        </p>
        {answer.sub && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.68rem', color: isSelected ? C.mute : C.faint, marginTop: '3px', lineHeight: 1.5, transition: 'color .2s' }}>
            {answer.sub}
          </p>
        )}
      </div>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSelected ? C.accent : 'transparent', flexShrink: 0, boxShadow: isSelected ? `0 0 10px ${C.accent}` : 'none', border: isSelected ? 'none' : `1px solid ${C.border}`, transition: 'all .25s' }} />
    </button>
  );
}

/* ── AI COMMENT ── */
function AIComment({ message, leadingCar, onContinue }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', opacity: vis ? 1 : 0, transition: 'opacity .5s ease' }}>
      <div style={{ maxWidth: '460px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '2rem' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, animation: 'pulse-dot 1.5s infinite' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '.54rem', letterSpacing: '.28em', textTransform: 'uppercase', color: C.accent }}>Insight IA</span>
        </div>
        <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: 'clamp(1.4rem,3.5vw,2rem)', color: C.text, lineHeight: 1.35, letterSpacing: '-.02em', marginBottom: '1rem', fontStyle: 'italic' }}>
          « {message} »
        </p>
        {leadingCar && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.72rem', color: C.mute, marginBottom: '2.5rem' }}>
            Profil actuel — <span style={{ color: C.accent }}>{leadingCar.make} {leadingCar.model}</span>
          </p>
        )}
        <button onClick={onContinue}
          style={{ fontFamily: 'var(--sans)', fontSize: '.65rem', letterSpacing: '.18em', textTransform: 'uppercase', color: C.bg, background: C.accent, border: 'none', padding: '.75rem 2.5rem', borderRadius: '50px', cursor: 'pointer', transition: 'opacity .2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '.8'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          Continuer →
        </button>
      </div>
    </div>
  );
}

/* ── INTERIM PROPOSAL ── */
function InterimProposal({ top3, confidence, excludedIds, onExclude, onAccept, onRefine }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  const visibleCars = (top3 || []).filter(c => !excludedIds.has(c.id));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 3.5rem', opacity: vis ? 1 : 0, transition: 'opacity .5s ease', overflowY: 'auto' }}>
      <div style={{ maxWidth: '520px', paddingTop: '2rem', paddingBottom: '2rem' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '1.5rem' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, animation: 'pulse-dot 1.5s infinite' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '.54rem', letterSpacing: '.28em', textTransform: 'uppercase', color: C.accent }}>
            Analyse intermédiaire — {confidence}% de confiance
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', lineHeight: 1.1, letterSpacing: '-.03em', color: C.text, marginBottom: '.75rem' }}>
          Voici ce que nous avons trouvé jusqu'à présent.
        </h2>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.72rem', color: C.mute, marginBottom: '2rem', lineHeight: 1.6 }}>
          Excluez une voiture qui ne vous correspond pas — elle disparaîtra de vos résultats.
        </p>

        {/* Cars list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2.5rem' }}>
          {visibleCars.length === 0 && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: '.72rem', color: C.faint, padding: '1rem 0' }}>
              Toutes les propositions ont été exclues. Affinez pour obtenir de nouvelles suggestions.
            </p>
          )}
          {visibleCars.map((car, i) => (
            <div key={car.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: i === 0 ? 'rgba(200,149,106,.1)' : C.surface, borderRadius: '10px', border: `1px solid ${i === 0 ? C.borderHi : C.border}`, transition: 'all .3s' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--serif-display)', fontWeight: i === 0 ? 700 : 400, fontSize: i === 0 ? '1.05rem' : '.92rem', color: i === 0 ? C.text : C.mute, lineHeight: 1.2 }}>
                  {car.make} {car.model}
                </p>
                {i === 0 && <p style={{ fontFamily: 'var(--sans)', fontSize: '.55rem', letterSpacing: '.15em', textTransform: 'uppercase', color: C.faint, marginTop: '3px' }}>Meilleure correspondance</p>}
              </div>
              <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: i === 0 ? '1.6rem' : '1.1rem', color: i === 0 ? C.accent : C.mute, lineHeight: 1, marginLeft: '1rem' }}>
                {car.matchScore}<span style={{ fontSize: '.5em', color: C.faint }}>%</span>
              </p>
              <button
                onClick={() => onExclude(car.id)}
                style={{ marginLeft: '1rem', fontFamily: 'var(--sans)', fontSize: '.55rem', letterSpacing: '.15em', textTransform: 'uppercase', color: C.faint, background: 'none', border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E06060'; e.currentTarget.style.borderColor = 'rgba(224,96,96,.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.faint; e.currentTarget.style.borderColor = C.border; }}
                title="Exclure cette voiture"
              >
                ✕ Exclure
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onAccept} disabled={visibleCars.length === 0}
            style={{ fontFamily: 'var(--sans)', fontSize: '.7rem', letterSpacing: '.18em', textTransform: 'uppercase', color: C.bg, background: visibleCars.length > 0 ? C.accent : C.border, border: 'none', padding: '.85rem 2rem', borderRadius: '50px', cursor: visibleCars.length > 0 ? 'pointer' : 'default', transition: 'opacity .2s', textAlign: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            Voir mon résultat final →
          </button>
          <button onClick={onRefine}
            style={{ fontFamily: 'var(--sans)', fontSize: '.7rem', letterSpacing: '.18em', textTransform: 'uppercase', color: C.mute, background: 'none', border: `1px solid ${C.border}`, padding: '.85rem 2rem', borderRadius: '50px', cursor: 'pointer', transition: 'all .2s', textAlign: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.borderHi; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.mute; e.currentTarget.style.borderColor = C.border; }}>
            Affiner avec 10 questions supplémentaires
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── FINAL REVEAL ── */
function FinalReveal({ onDone }) {
  const [step, setStep]   = useState(0);
  const [found, setFound] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const timers = REVEAL_STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), 500 + i * 520)
    );
    const done = setTimeout(() => {
      setFound(true);
      setTimeout(() => onDoneRef.current(), 1400);
    }, 500 + REVEAL_STEPS.length * 520 + 400);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', background: `radial-gradient(ellipse, rgba(200,149,106,.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {!found ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={{ position: 'relative', width: 10, height: 10 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.accent, animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.accent, position: 'relative', zIndex: 1 }} />
            </div>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '.62rem', letterSpacing: '.28em', textTransform: 'uppercase', color: C.mute }}>Analyse finale</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            {REVEAL_STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: i < step ? 1 : 0.12, transform: i < step ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity .45s ease, transform .45s ease' }}>
                <span style={{ fontSize: '.62rem', color: i < step ? C.accent : C.faint, transition: 'color .4s', flexShrink: 0, width: '10px' }}>
                  {i < step ? '✓' : '○'}
                </span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '.76rem', color: i < step ? C.text : C.faint, letterSpacing: '.03em', transition: 'color .4s' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', opacity: 1, animation: 'fadeIn .6s ease' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.3em', textTransform: 'uppercase', color: C.accent, marginBottom: '1.2rem' }}>✓ Correspondance trouvée</p>
          <p style={{ fontFamily: 'var(--serif-display)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.text, letterSpacing: '-.03em' }}>Votre voiture idéale</p>
        </div>
      )}
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
