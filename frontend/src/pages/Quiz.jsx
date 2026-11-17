import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARS } from '../data/cars';
import { useIsDesktop } from '../hooks/useMediaQuery';
import {
  createSession,
  getBestQuestion,
  applyAnswer,
  isDone,
  getTopCars,
  displayConfidence,
  formatQuestion,
  getRecommendations,
} from '../engine/quiz';

/* ── Design tokens — palette du site ── */
const C = {
  bg: 'var(--bg)',
  panel: 'var(--bg-2)',
  surface: 'var(--bg)',
  surface2: 'var(--bg-2)',
  text: 'var(--ink)',
  mute: 'var(--ink-mute)',
  faint: 'var(--ink-mute)',
  accent: 'var(--gold)',
  gold: 'var(--gold-2)',
  border: 'var(--line)',
  borderHi: 'var(--gold)',
};

const DEDUCTION_BANK = {
  luxury: [
    'Préférence pour les intérieurs raffinés',
    'Attrait pour les finitions premium',
    'Sensibilité au prestige',
    'Confort identifié comme prioritaire',
    'Usage représentatif valorisé',
  ],
  performance: [
    'Attrait pour la puissance moteur',
    'Conduite dynamique valorisée',
    'Performance comme critère clé',
    'Profil sportif confirmé',
    'Réactivité recherchée',
  ],
  eco: [
    'Conscience environnementale détectée',
    "Économie d'usage valorisée",
    'Approche rationnelle confirmée',
    'Efficience comme priorité',
    'Impact réduit recherché',
  ],
  practical: [
    "Besoin d'espace identifié",
    'Polyvalence recherchée',
    'Usage familial probable',
    'Praticité avant prestige',
    'Modularité valorisée',
  ],
};

const PERSONALITY = {
  luxury: ['Connaisseur', 'Executive', 'Raffiné'],
  performance: ['Sportif', 'Passionné', 'Dynamique'],
  eco: ['Raisonné', 'Conscient', 'Économe'],
  practical: ['Polyvalent', 'Familial', 'Pragmatique'],
};

const BUDGET_MAP = {
  luxury: '600 000 – 1 200 000 DH',
  performance: '400 000 – 900 000 DH',
  eco: '150 000 – 350 000 DH',
  practical: '200 000 – 500 000 DH',
};

const AI_INSIGHTS = [
  { at: 5, msg: 'Vos premiers choix révèlent une personnalité affirmée…' },
  { at: 9, msg: 'La cohérence de vos réponses est remarquable. Le profil se précise.' },
  { at: 14, msg: "Nous affinons votre correspondance. Elle s'annonce excellente." },
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
const REFINE_Q = 10;

/* ─────────────────────────────────────────────── */
export default function Quiz({ onComplete }) {
  const navigate = useNavigate();

  const [phase, setPhase] = useState('intro');
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [leadingCar, setLeadingCar] = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [topProbs, setTopProbs] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [interimDone, setInterimDone] = useState(false);
  const [refineLeft, setRefineLeft] = useState(0);
  const [finalTop3, setFinalTop3] = useState(null);
  const [excludedIds, setExcludedIds] = useState(new Set());

  const rawQuestionRef = useRef(null);
  // Historique des états avant chaque réponse : permet « Question précédente »
  // sans toucher au moteur (chaque réponse produit une nouvelle session).
  const historyRef = useRef([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const isDesktop = useIsDesktop();

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
    historyRef.current = [];
    setCanGoBack(false);
    setVisible(false);
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  async function handleAnswer(answerIndex) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    historyRef.current.push({
      session,
      rawQuestion: rawQuestionRef.current,
      question,
      confidence,
      leadingCar,
      topProbs,
      deductions,
      answeredCount,
      interimDone,
      refineLeft,
    });
    setCanGoBack(true);
    setPendingAnswer(answerIndex);
    setSubmitting(true);
    setVisible(false);
    await delay(220);

    const s = {
      ...session,
      carProbs: { ...session.carProbs },
      askedIds: new Set(session.askedIds),
      answers: [...session.answers],
    };
    applyAnswer(s, rawQuestionRef.current, answerIndex, CARS);

    const conf = displayConfidence(s, CARS);
    const top5 = getTopCars(s, CARS, 5);
    const top = top5[0];

    setConfidence(conf);
    if (top) setLeadingCar({ make: top.make, model: top.model, category: top.category });
    setTopProbs(
      top5.map((c) => ({ make: c.make, model: c.model, prob: c._prob, category: c.category })),
    );

    if (top) {
      const cat = top.category || 'practical';
      const bank = DEDUCTION_BANK[cat] || DEDUCTION_BANK.practical;
      setDeductions((prev) => [bank[s.askedIds.size % bank.length], ...prev].slice(0, 7));
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
    const insight = AI_INSIGHTS.find((i) => i.at === newCount);
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

  const buildTop3 = (s) => getRecommendations(s, CARS, excludedIds);

  function goBack() {
    if (submittingRef.current) return;
    const prev = historyRef.current.pop();
    if (!prev) return;
    rawQuestionRef.current = prev.rawQuestion;
    setSession(prev.session);
    setQuestion(prev.question);
    setConfidence(prev.confidence);
    setLeadingCar(prev.leadingCar);
    setTopProbs(prev.topProbs);
    setDeductions(prev.deductions);
    setAnsweredCount(prev.answeredCount);
    setInterimDone(prev.interimDone);
    setRefineLeft(prev.refineLeft);
    setPendingAnswer(null);
    setCanGoBack(historyRef.current.length > 0);
    setVisible(false);
    setPhase('asking');
    requestAnimationFrame(() => setVisible(true));
  }

  function excludeCar(carId) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      next.add(carId);
      return next;
    });
    setFinalTop3((prev) => (prev ? prev.filter((c) => c.id !== carId) : prev));
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
  if (phase === 'intro') return <Intro onStart={startQuiz} />;
  if (phase === 'init') return <InitScreen />;
  if (phase === 'revealing') return <FinalReveal onDone={goToResults} />;

  return (
    <div
      className="quiz-shell flex flex-col overflow-hidden md:flex-row"
      style={{ background: C.bg, position: 'relative' }}
    >
      {/* Vidéo de fond (panneau droit) : uniquement à partir de 768 px, jamais téléchargée sur téléphone */}
      {isDesktop && (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 'calc(100% - 330px)',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.38,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <source src="/car-bg.mp4" type="video/mp4" />
          </video>
          {/* Overlay to keep text readable over video */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 'calc(100% - 330px)',
              height: '100%',
              background: 'rgba(240,232,220,0.28)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}

      <LeftPanel
        className="hidden h-full w-[330px] shrink-0 md:flex md:flex-col"
        confidence={confidence}
        topProbs={topProbs}
        deductions={deductions}
        refineLeft={refineLeft}
      />
      <MobileAnalysisBar
        topProbs={topProbs}
        confidence={confidence}
        open={analysisOpen}
        onOpen={() => setAnalysisOpen(true)}
      />
      {analysisOpen && !isDesktop && (
        <AnalysisDrawer onClose={() => setAnalysisOpen(false)}>
          <LeftPanel
            className="flex h-full w-full flex-col"
            confidence={confidence}
            topProbs={topProbs}
            deductions={deductions}
            refineLeft={refineLeft}
          />
        </AnalysisDrawer>
      )}
      <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {phase === 'asking' && (
          <QuestionCard
            question={question}
            pendingAnswer={pendingAnswer}
            visible={visible}
            submitting={submitting}
            confidence={confidence}
            refineLeft={refineLeft}
            onAnswer={handleAnswer}
            canGoBack={canGoBack}
            onBack={goBack}
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
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/sunset.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(6px)',
          transform: 'scale(1.08)',
          animation: 'slowZoom 22s ease-in-out infinite alternate',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,9,6,.65)' }} />
      <div
        style={{
          position: 'absolute',
          top: 'clamp(1.8rem,4vh,3rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--serif-display)',
            fontWeight: 700,
            fontSize: '1.15rem',
            color: '#fff',
            letterSpacing: '-.01em',
          }}
        >
          AutoAssist
        </p>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.75rem',
            letterSpacing: '.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            marginTop: '.35rem',
          }}
        >
          Conseil Automobile
        </p>
      </div>
      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          padding: '0 2rem',
          maxWidth: '860px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(3.2rem,8.5vw,6.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-.02em',
            color: '#fff',
            marginBottom: '1.5rem',
            textWrap: 'balance',
          }}
        >
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Prêt </em>à trouver
          <br />
          <span style={{ fontStyle: 'normal', fontWeight: 700 }}>ta voiture idéale ?</span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,.6)',
            lineHeight: 1.6,
            marginBottom: '2.8rem',
            fontWeight: 300,
          }}
        >
          Entre 15 et 25 questions adaptatives. Un résultat sur mesure.
        </p>
        <button
          onClick={onStart}
          style={{
            background: '#fff',
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F0E8DE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
          }}
        >
          Commencer l'analyse →
        </button>
      </div>
    </div>
  );
}

/* ── INIT SCREEN ── */
function InitScreen() {
  return (
    <div
      style={{
        height: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 10, height: 10, margin: '0 auto 1.5rem' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: C.accent,
              animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite',
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: C.accent,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.8125rem',
            letterSpacing: '.25em',
            textTransform: 'uppercase',
            color: C.mute,
          }}
        >
          Initialisation de l'IA…
        </p>
      </div>
    </div>
  );
}

/* ── LEFT PANEL ── */
function LeftPanel({ className, confidence, topProbs, deductions, refineLeft }) {
  const top1 = topProbs[0];
  const top2 = topProbs[1];
  const top3 = topProbs[2];
  const cat = top1?.category || 'practical';
  const tags = PERSONALITY[cat] || PERSONALITY.practical;
  const toScore = (p) => Math.min(Math.round(50 + (p || 0) * 140), 99);

  const GOLD = 'var(--gold)';
  const GOLDR = '#C17B5A';

  const TXT = '#D4B07A'; /* crème dorée — texte principal */
  const MUTE = '#A07840'; /* dorée atténuée — labels */

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#170E00',
      }}
    >
      {/* Bokeh CSS — cercles flous dorés */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[
          { w: 180, h: 180, top: '4%', left: '55%', color: 'rgba(180,130,30,.32)' },
          { w: 140, h: 140, top: '28%', left: '10%', color: 'rgba(160,110,20,.25)' },
          { w: 200, h: 200, top: '42%', left: '50%', color: 'rgba(170,120,25,.28)' },
          { w: 120, h: 120, top: '65%', left: '5%', color: 'rgba(150,100,15,.22)' },
          { w: 160, h: 160, top: '72%', left: '55%', color: 'rgba(165,115,22,.26)' },
          { w: 100, h: 100, top: '88%', left: '30%', color: 'rgba(140,95,12,.2)' },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: b.w,
              height: b.h,
              top: b.top,
              left: b.left,
              background: b.color,
              filter: 'blur(38px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '1.75rem 1.5rem',
          gap: '1.15rem',
          overflowY: 'auto',
        }}
      >
        {/* Header — pulsing dot + label */}
        <header
          className="lx-reveal"
          style={{ '--lx-delay': '.05s', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span className="lx-status-dot" aria-hidden="true" />
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: TXT,
            }}
          >
            IA Analyse — En direct
          </span>
        </header>

        {/* Top divider */}
        <hr
          className="lx-reveal"
          style={{ '--lx-delay': '.15s', border: 0, height: '1px', background: 'rgba(0,0,0,.15)' }}
        />

        {/* Current match card */}
        <section
          className="lx-reveal"
          style={{
            '--lx-delay': '.25s',
            borderRadius: '12px',
            padding: '1.15rem 1.1rem',
            border: `1px solid rgba(212,176,122,${top1 ? '.30' : '.12'})`,
            background: 'rgba(255,255,255,.05)',
            transition: 'border-color .5s',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: MUTE,
              marginBottom: '.6rem',
            }}
          >
            Correspondance actuelle
          </p>
          {top1 ? (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
            >
              <div className="lx-breathe">
                <p
                  style={{
                    fontFamily: 'var(--serif-display)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: TXT,
                    lineHeight: 1.1,
                  }}
                >
                  {top1.make}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--serif-display)',
                    fontWeight: 400,
                    fontSize: '.9rem',
                    color: MUTE,
                    lineHeight: 1.1,
                  }}
                >
                  {top1.model}
                </p>
              </div>
              <p
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontWeight: 800,
                  fontSize: '2rem',
                  color: TXT,
                  lineHeight: 1,
                  transition: 'all .6s',
                }}
              >
                {toScore(top1.prob)}
                <span style={{ fontSize: '.42em', color: MUTE }}>%</span>
              </p>
            </div>
          ) : (
            <p
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: '1rem',
                color: TXT,
                fontStyle: 'italic',
              }}
            >
              Analyse en cours…
            </p>
          )}
        </section>

        {/* Confidence gauge */}
        <section className="lx-reveal" style={{ '--lx-delay': '.38s' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: MUTE,
              }}
            >
              Confiance
            </span>
            <span style={{ fontFamily: 'var(--serif-display)', fontSize: '.85rem', color: TXT }}>
              {confidence}%
            </span>
          </div>
          <div
            style={{
              height: '3px',
              background: 'rgba(212,176,122,.15)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              className="lx-conf-fill"
              style={{
                width: `${confidence}%`,
                background: `linear-gradient(90deg, #7A4A38, ${GOLDR})`,
              }}
            />
          </div>
        </section>

        {/* Alternatives */}
        {(top2 || top3) && (
          <div className="lx-reveal" style={{ '--lx-delay': '.48s' }}>
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: MUTE,
                marginBottom: '.5rem',
              }}
            >
              Alternatives
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[top2, top3].filter(Boolean).map((car, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '.45rem .75rem',
                    background: 'rgba(255,255,255,.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(212,176,122,.15)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '.8125rem', color: TXT }}>
                    {car.make} {car.model}
                  </span>
                  <span
                    style={{ fontFamily: 'var(--serif-display)', fontSize: '.82rem', color: TXT }}
                  >
                    {toScore(car.prob)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personality */}
        {confidence > 15 && (
          <div>
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: MUTE,
                marginBottom: '.5rem',
              }}
            >
              Profil détecté
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: '.75rem',
                    letterSpacing: '.08em',
                    color: TXT,
                    background: 'rgba(212,176,122,.1)',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    border: '1px solid rgba(212,176,122,.22)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        {confidence > 25 && (
          <div
            style={{
              padding: '.65rem .75rem',
              background: 'rgba(255,255,255,.05)',
              borderRadius: '8px',
              border: '1px solid rgba(212,176,122,.15)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: MUTE,
                marginBottom: '4px',
              }}
            >
              Budget estimé
            </p>
            <p style={{ fontFamily: 'var(--serif-display)', fontSize: '.82rem', color: TXT }}>
              {BUDGET_MAP[cat]}
            </p>
          </div>
        )}

        {/* Refinement badge */}
        {refineLeft > 0 && (
          <div
            style={{
              padding: '.6rem .75rem',
              background: 'rgba(193,123,90,.09)',
              borderRadius: '8px',
              border: '1px solid rgba(193,123,90,.22)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: GOLD,
                marginBottom: '3px',
              }}
            >
              Mode raffinement
            </p>
            <p style={{ fontFamily: 'var(--serif-display)', fontSize: '.95rem', color: '#fff' }}>
              {refineLeft} question{refineLeft > 1 ? 's' : ''} restante{refineLeft > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Deduction log */}
        {deductions.length > 0 && (
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: MUTE,
                marginBottom: '.5rem',
              }}
            >
              Déductions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {deductions.map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    opacity: Math.max(0.15, 1 - i * 0.13),
                    transition: 'opacity .4s',
                  }}
                >
                  <span
                    style={{ color: GOLD, fontSize: '.75rem', flexShrink: 0, marginTop: '2px' }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: '.8125rem',
                      color: TXT,
                      lineHeight: 1.45,
                    }}
                  >
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom divider */}
        <hr
          className="lx-reveal"
          style={{ '--lx-delay': '.55s', border: 0, height: '1px', background: 'rgba(0,0,0,.15)' }}
        />

        {/* Footer */}
        <footer className="lx-reveal" style={{ '--lx-delay': '.65s' }}>
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.1em',
              color: MUTE,
              lineHeight: 1.7,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <span style={{ color: TXT, fontSize: '.6rem', flexShrink: 0, marginTop: '1px' }}>
              ✦
            </span>
            <span>Analyse parmi {CARS.length} véhicules en temps réel</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ── QUESTION CARD ── */
function QuestionCard({
  question,
  pendingAnswer,
  visible,
  submitting,
  confidence,
  refineLeft,
  onAnswer,
  canGoBack,
  onBack,
}) {
  if (!question) return null;

  // Progression : vers la proposition intermédiaire (15 questions), puis dans l'affinage.
  const inRefine = refineLeft > 0;
  const progress = inRefine
    ? (REFINE_Q - refineLeft) / REFINE_Q
    : Math.min((question.number - 1) / INTERIM_Q, 1);
  const progressLabel = inRefine
    ? `Affinage — ${refineLeft} question${refineLeft > 1 ? 's' : ''} au plus`
    : `Question ${question.number} sur ${INTERIM_Q}`;

  return (
    <div className="flex min-h-full flex-col items-center px-4 pb-6 pt-5 sm:px-6 md:justify-center md:px-12 md:py-10">
      {/* Progression */}
      <div className="w-full max-w-[580px] pb-5 md:pb-10">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '8px',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: '#000',
              fontWeight: 600,
            }}
          >
            {progressLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontWeight: 800,
              fontSize: '.85rem',
              color: '#000',
              whiteSpace: 'nowrap',
            }}
          >
            {confidence}% <span style={{ fontWeight: 500 }}>de confiance</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progression du quiz"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          style={{
            height: '4px',
            background: 'rgba(0,0,0,.15)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(progress * 100, 3)}%`,
              background: '#000',
              borderRadius: '4px',
              transition: 'width .6s cubic-bezier(.4,0,.2,1)',
            }}
          />
        </div>
      </div>

      {/* Question + Answers */}
      <div
        className="flex w-full max-w-[580px] flex-col gap-5 md:gap-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(22px)',
          transition: 'opacity .4s ease, transform .4s ease',
        }}
      >
        {/* Bold sans-serif headline — style "Time Out!" */}
        <h2
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 900,
            fontSize: 'clamp(1.45rem,5vw,3.4rem)',
            lineHeight: 1.1,
            textWrap: 'balance',
            letterSpacing: '-.02em',
            color: '#000',
            textAlign: 'center',
          }}
        >
          {question.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {question.answers.map((answer) => (
            <AnswerCard
              key={answer.index}
              answer={answer}
              isSelected={pendingAnswer === answer.index}
              disabled={submitting}
              onClick={() => {
                if (!submitting) onAnswer(answer.index);
              }}
            />
          ))}
        </div>

        {/* Retour : en bas, à portée de pouce */}
        <div className="flex min-h-[44px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack || submitting}
            className="inline-flex min-h-[44px] items-center rounded-full px-4"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.875rem',
              fontWeight: 600,
              color: '#000',
              border: '1.5px solid rgba(0,0,0,.25)',
              background: 'rgba(255,255,255,.6)',
              visibility: canGoBack ? 'visible' : 'hidden',
            }}
          >
            ← Question précédente
          </button>
          <p
            className="hidden sm:block"
            style={{
              fontFamily: 'var(--sans)',
              fontWeight: 500,
              fontSize: '.75rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: '#000',
              textAlign: 'right',
            }}
          >
            Choisissez une réponse pour continuer
          </p>
        </div>
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
      onMouseEnter={() => {
        if (!disabled) setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        border: `2px solid ${isSelected ? '#000' : hovered ? 'rgba(0,0,0,.3)' : 'rgba(0,0,0,.14)'}`,
        background: isSelected
          ? '#000'
          : hovered
            ? 'rgba(255,255,255,.92)'
            : 'rgba(255,255,255,.78)',
        padding: '.9rem 1.1rem',
        minHeight: '56px',
        borderRadius: '10px',
        transition: 'all .22s cubic-bezier(.4,0,.2,1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: disabled ? 'default' : 'pointer',
        transform: isSelected ? 'scale(1.012)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 8px 32px rgba(0,0,0,.3)'
          : hovered
            ? '0 4px 16px rgba(0,0,0,.08)'
            : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--sans)',
          fontSize: '.8125rem',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: isSelected ? 'rgba(255,255,255,.7)' : '#000',
          fontWeight: 700,
          flexShrink: 0,
          width: '16px',
          transition: 'color .2s',
        }}
      >
        {LETTERS[answer.index]}
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(1rem,2vw,1.05rem)',
            fontWeight: isSelected ? 700 : 500,
            color: isSelected ? '#FFF' : '#000',
            lineHeight: 1.35,
            transition: 'color .2s',
          }}
        >
          {answer.text}
        </p>
        {answer.sub && (
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.8125rem',
              fontWeight: 400,
              color: isSelected ? 'rgba(255,255,255,.75)' : '#000',
              marginTop: '3px',
              lineHeight: 1.5,
              transition: 'color .2s',
            }}
          >
            {answer.sub}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── AI COMMENT ── */
function AIComment({ message, leadingCar, onContinue }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-5 py-10 md:p-12"
      style={{
        opacity: vis ? 1 : 0,
        transition: 'opacity .5s ease',
      }}
    >
      <div style={{ maxWidth: '460px', textAlign: 'center' }}>
        <div
          style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '2rem' }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: C.accent,
              animation: 'pulse-dot 1.5s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: C.accent,
            }}
          >
            Insight IA
          </span>
        </div>
        <p
          style={{
            fontFamily: 'var(--serif-display)',
            fontWeight: 400,
            fontSize: 'clamp(1.4rem,3.5vw,2rem)',
            color: C.text,
            lineHeight: 1.35,
            letterSpacing: '-.02em',
            marginBottom: '1rem',
            fontStyle: 'italic',
          }}
        >
          « {message} »
        </p>
        {leadingCar && (
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.875rem',
              color: C.mute,
              marginBottom: '2.5rem',
            }}
          >
            Profil actuel —{' '}
            <span style={{ color: C.accent }}>
              {leadingCar.make} {leadingCar.model}
            </span>
          </p>
        )}
        <button
          onClick={onContinue}
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.8125rem',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: C.bg,
            background: C.accent,
            border: 'none',
            padding: '.75rem 2.5rem',
            minHeight: '48px',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'opacity .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

/* ── INTERIM PROPOSAL ── */
function InterimProposal({ top3, confidence, excludedIds, onExclude, onAccept, onRefine }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  const visibleCars = (top3 || []).filter((c) => !excludedIds.has(c.id));

  return (
    <div
      className="flex min-h-full flex-col justify-center px-4 sm:px-6 md:px-14"
      style={{
        opacity: vis ? 1 : 0,
        transition: 'opacity .5s ease',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: C.accent,
              animation: 'pulse-dot 1.5s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.75rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: C.accent,
            }}
          >
            Analyse intermédiaire — {confidence}% de confiance
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--serif-display)',
            fontWeight: 800,
            fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
            lineHeight: 1.1,
            letterSpacing: '-.03em',
            color: C.text,
            marginBottom: '.75rem',
          }}
        >
          Voici ce que nous avons trouvé jusqu'à présent.
        </h2>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.875rem',
            color: C.mute,
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Excluez une voiture qui ne vous correspond pas — elle disparaîtra de vos résultats.
        </p>

        {/* Cars list */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2.5rem' }}
        >
          {visibleCars.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.875rem',
                color: C.faint,
                padding: '1rem 0',
              }}
            >
              Toutes les propositions ont été exclues. Affinez pour obtenir de nouvelles
              suggestions.
            </p>
          )}
          {visibleCars.map((car, i) => (
            <div
              key={car.id || i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '.75rem 1rem',
                gap: '.5rem',
                background: i === 0 ? 'rgba(200,149,106,.1)' : C.surface,
                borderRadius: '10px',
                border: `1px solid ${i === 0 ? C.borderHi : C.border}`,
                transition: 'all .3s',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: 'var(--serif-display)',
                    fontWeight: i === 0 ? 700 : 400,
                    fontSize: i === 0 ? '1.05rem' : '.92rem',
                    color: i === 0 ? C.text : C.mute,
                    lineHeight: 1.2,
                  }}
                >
                  {car.make} {car.model}
                </p>
                {i === 0 && (
                  <p
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: '.75rem',
                      letterSpacing: '.15em',
                      textTransform: 'uppercase',
                      color: C.faint,
                      marginTop: '3px',
                    }}
                  >
                    Meilleure correspondance
                  </p>
                )}
              </div>
              <p
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontWeight: 800,
                  fontSize: i === 0 ? '1.6rem' : '1.1rem',
                  color: i === 0 ? C.accent : C.mute,
                  lineHeight: 1,
                  marginLeft: '1rem',
                }}
              >
                {car.matchScore}
                <span style={{ fontSize: '.5em', color: C.faint }}>%</span>
              </p>
              <button
                onClick={() => onExclude(car.id)}
                aria-label={`Exclure ${car.make} ${car.model}`}
                className="inline-flex min-h-[44px] items-center"
                style={{
                  marginLeft: '.25rem',
                  fontFamily: 'var(--sans)',
                  fontSize: '.75rem',
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: C.faint,
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  padding: '0 12px',
                  borderRadius: '22px',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E06060';
                  e.currentTarget.style.borderColor = 'rgba(224,96,96,.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.faint;
                  e.currentTarget.style.borderColor = C.border;
                }}
                title="Exclure cette voiture"
              >
                ✕ Exclure
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onAccept}
            disabled={visibleCars.length === 0}
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.8125rem',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: C.bg,
              background: visibleCars.length > 0 ? C.accent : C.border,
              border: 'none',
              padding: '.85rem 1.25rem',
              minHeight: '48px',
              borderRadius: '50px',
              cursor: visibleCars.length > 0 ? 'pointer' : 'default',
              transition: 'opacity .2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Voir mon résultat final →
          </button>
          <button
            onClick={onRefine}
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.8125rem',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: C.mute,
              background: 'none',
              border: `1px solid ${C.border}`,
              padding: '.85rem 1.25rem',
              minHeight: '48px',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all .2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.text;
              e.currentTarget.style.borderColor = C.borderHi;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.mute;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            Affiner avec 10 questions supplémentaires
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── FINAL REVEAL ── */
function FinalReveal({ onDone }) {
  const [step, setStep] = useState(0);
  const [found, setFound] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timers = REVEAL_STEPS.map((_, i) => setTimeout(() => setStep(i + 1), 500 + i * 520));
    const done = setTimeout(
      () => {
        setFound(true);
        setTimeout(() => onDoneRef.current(), 1400);
      },
      500 + REVEAL_STEPS.length * 520 + 400,
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '700px',
          height: '700px',
          background: `radial-gradient(ellipse, rgba(200,149,106,.05) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {!found ? (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'center',
              marginBottom: '3rem',
            }}
          >
            <div style={{ position: 'relative', width: 10, height: 10 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: C.accent,
                  animation: 'lx-ping 1.4s cubic-bezier(0,0,.2,1) infinite',
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: C.accent,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: '.75rem',
                letterSpacing: '.28em',
                textTransform: 'uppercase',
                color: C.mute,
              }}
            >
              Analyse finale
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            {REVEAL_STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: i < step ? 1 : 0.12,
                  transform: i < step ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'opacity .45s ease, transform .45s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '.62rem',
                    color: i < step ? C.accent : C.faint,
                    transition: 'color .4s',
                    flexShrink: 0,
                    width: '10px',
                  }}
                >
                  {i < step ? '✓' : '○'}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: '.76rem',
                    color: i < step ? C.text : C.faint,
                    letterSpacing: '.03em',
                    transition: 'color .4s',
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', opacity: 1, animation: 'fadeIn .6s ease' }}>
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '.6rem',
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              color: C.accent,
              marginBottom: '1.2rem',
            }}
          >
            ✓ Correspondance trouvée
          </p>
          <p
            style={{
              fontFamily: 'var(--serif-display)',
              fontWeight: 800,
              fontSize: 'clamp(2rem,5vw,3.5rem)',
              color: C.text,
              letterSpacing: '-.03em',
            }}
          >
            Votre voiture idéale
          </p>
        </div>
      )}
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── BANDEAU D'ANALYSE COMPACT (téléphone) ── */
function MobileAnalysisBar({ topProbs, confidence, open, onOpen }) {
  const top1 = topProbs[0];
  const TXT = '#E2C391';
  return (
    <div
      className="flex shrink-0 items-center gap-3 px-4 py-2 md:hidden"
      style={{ background: '#170E00', color: TXT, borderBottom: '1px solid rgba(212,176,122,.18)' }}
    >
      <div className="min-w-0 flex-1">
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '.75rem',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: '#C9A06A',
          }}
        >
          Correspondance actuelle
        </p>
        <p
          className="truncate"
          style={{ fontFamily: 'var(--serif-display)', fontSize: '1rem', fontWeight: 700 }}
        >
          {top1 ? `${top1.make} ${top1.model}` : 'Analyse en cours…'}
        </p>
      </div>
      <p
        aria-label={`Confiance ${confidence} %`}
        style={{ fontFamily: 'var(--serif-display)', fontSize: '1.25rem', fontWeight: 800 }}
      >
        {confidence}
        <span style={{ fontSize: '.6em' }}>%</span>
      </p>
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        aria-controls="quiz-analyse"
        className="inline-flex min-h-[44px] items-center rounded-full px-4"
        style={{
          fontFamily: 'var(--sans)',
          fontSize: '.875rem',
          fontWeight: 600,
          color: '#170E00',
          background: TXT,
        }}
      >
        Analyse
      </button>
    </div>
  );
}

/* ── TIROIR : panneau d'analyse complet sur téléphone ── */
function AnalysisDrawer({ onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end md:hidden">
      <button
        type="button"
        aria-label="Fermer l'analyse"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,.55)' }}
      />
      <div
        id="quiz-analyse"
        role="dialog"
        aria-modal="true"
        aria-label="Analyse en direct"
        className="relative flex h-[85vh] flex-col overflow-hidden rounded-t-2xl"
        style={{ background: '#170E00' }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full"
          style={{ color: '#E2C391', background: 'rgba(255,255,255,.08)', fontSize: '1.1rem' }}
          aria-label="Fermer l'analyse"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
