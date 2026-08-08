import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  speak,
  cancelSpeech,
  useSpeechToText,
  useMicAnalyser,
} from "./lib/voice";

/* ===================== Types & mock data ===================== */

type Screen = "welcome" | "resume" | "interview" | "results";
type Difficulty = "easy" | "medium" | "hard";

interface Answer {
  question: string;
  transcript: string;
  score: number;
  reasoning: string;
}

const DIFFICULTY_META: Record<
  Difficulty,
  { title: string; desc: string; className: string }
> = {
  easy: {
    title: "Easy",
    desc: "Warm-up questions to settle your nerves and find your voice.",
    className: "easy",
  },
  medium: {
    title: "Medium",
    desc: "Role-relevant scenarios that test depth, not just recall.",
    className: "medium",
  },
  hard: {
    title: "Hard",
    desc: "Curveballs and pressure-tests — for when you want it real.",
    className: "hard",
  },
};

const MOCK_QUESTIONS: Record<Difficulty, string[]> = {
  easy: [
    "Namaste 👋, ready when you are. Tell me a little about yourself and what you're looking for next.",
    "What's a project you're proud of, and why?",
    "How would a teammate describe working with you?",
    "What draws you to this kind of role?",
    "What's one thing you're actively trying to improve right now?",
  ],
  medium: [
    "Walk me through a time you disagreed with a decision at work. What did you do?",
    "Describe a project that didn't go as planned. What would you change?",
    "How do you prioritize when everything feels urgent?",
    "Tell me about a time you had to learn something quickly to get a job done.",
    "How do you handle feedback that stings a little?",
  ],
  hard: [
    "You inherit a system with no documentation and an angry stakeholder. What's your first hour like?",
    "Convince me your biggest weakness hasn't held you back — with a real example.",
    "Tell me about a decision you made that you'd take back today.",
    "Your team ships something broken in production on a Friday evening. Walk me through it.",
    "If I called your last manager right now, what would they hesitate to tell me?",
  ],
};

const MOCK_SKILLS = ["React", "TypeScript", "System Design", "Leadership", "SQL", "Communication"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};
const screenTransition = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
  transition: { type: "spring", stiffness: 180, damping: 24 },
};

/* ===================== Orb ===================== */

type OrbState = "idle" | "speaking" | "listening" | "thinking";

function Orb({ state = "idle", level = 0 }: { state?: OrbState; level?: number }) {
  const bars = useMemo(() => new Array(9).fill(0), []);
  return (
    <div className="orb-wrap">
      <motion.div
        className="orb-glow"
        animate={
          state === "idle"
            ? { opacity: [0.4, 0.65, 0.4], scale: [1, 1.05, 1] }
            : state === "listening"
            ? { opacity: 0.5 + level * 0.5, scale: 1 + level * 0.15 }
            : state === "speaking"
            ? { opacity: [0.5, 0.75, 0.5], scale: [1, 1.08, 1] }
            : { opacity: [0.45, 0.6, 0.45], scale: 1 }
        }
        transition={
          state === "listening"
            ? { duration: 0.15 }
            : { duration: state === "thinking" ? 1.6 : 1.8, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div className="orb-ring">
        {state === "speaking" || state === "listening" ? (
          <div className="orb-bars">
            {bars.map((_, i) => (
              <motion.span
                key={i}
                className="orb-bar"
                animate={{
                  height:
                    state === "listening"
                      ? [4, 6 + level * 34 * Math.abs(Math.sin(i + 1)), 4]
                      : [4, 8 + ((i % 4) + 1) * 6, 4],
                }}
                transition={{
                  duration: state === "listening" ? 0.4 : 0.7 + (i % 3) * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.03,
                }}
              />
            ))}
          </div>
        ) : state === "thinking" ? (
          <motion.div
            className="orb-mark"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          >
            ?
          </motion.div>
        ) : (
          <motion.div
            className="orb-mark"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ?
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ===================== Theme toggle ===================== */

function ThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      {theme === "dark" ? "☾ Dark" : "☀ Light"}
    </button>
  );
}

/* ===================== Screen 1: Welcome ===================== */

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const mic = useMicAnalyser();
  const [checked, setChecked] = useState(false);

  const runCheck = async () => {
    const ok = await mic.start();
    if (ok) {
      setTimeout(() => {
        mic.stop();
        setChecked(true);
      }, 1800);
    }
  };

  return (
    <motion.div className="screen" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <Orb state="idle" />
      </motion.div>
      <motion.p className="tagline" variants={item}>
        Your voice, your interview.
      </motion.p>
      <motion.h1 className="headline" variants={item}>
        PrashnAI
      </motion.h1>

      <motion.div className="steps" variants={item}>
        <div className="step-row">
          <span className="step-index">01</span>
          <span className="step-text">Upload your resume</span>
        </div>
        <div className="step-row">
          <span className="step-index">02</span>
          <span className="step-text">Pick a difficulty and answer by voice</span>
        </div>
        <div className="step-row">
          <span className="step-index">03</span>
          <span className="step-text">Get your result, instantly</span>
        </div>
      </motion.div>

      <motion.div className="mic-check" variants={item}>
        <p className="mic-check-label">
          {checked ? "Mic sounds good ✓" : "Quick mic check before we begin"}
        </p>
        <div className="level-meter">
          <motion.div
            className="level-meter-fill"
            animate={{ width: `${Math.round((mic.active ? mic.level : checked ? 1 : 0) * 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        {mic.error && <p className="mic-error">{mic.error}</p>}
        {!checked && !mic.active && (
          <div className="btn-row">
            <button className="btn-secondary" onClick={runCheck}>
              Test my mic
            </button>
          </div>
        )}
      </motion.div>

      <motion.div className="btn-row" variants={item}>
        <button className="btn-primary" onClick={onContinue}>
          Get Started
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ===================== Screen 2: Resume Submitter ===================== */

function ResumeScreen({ onContinue }: { onContinue: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "reading" | "done">("idle");

  const handleFile = (name: string) => {
    setFileName(name);
    setStage("reading");
    setTimeout(() => setStage("done"), 1600);
  };

  return (
    <motion.div className="screen screen-left" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} style={{ alignSelf: "center" }}>
        <Orb state={stage === "reading" ? "thinking" : "idle"} />
      </motion.div>
      <motion.h2 className="headline" variants={item} style={{ alignSelf: "center", fontSize: 24 }}>
        Drop in your resume
      </motion.h2>

      <motion.div
        variants={item}
        className={`dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f.name);
        }}
      >
        <p className="dropzone-title">Drag & drop your resume</p>
        <p>PDF or DOCX — or click to browse</p>
        <label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0].name)}
          />
          <span className="btn-secondary" style={{ display: "inline-block", marginTop: 14 }}>
            Choose file
          </span>
        </label>
        {fileName && <div className="file-chip">📄 {fileName}</div>}
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === "reading" && (
          <motion.p
            key="reading"
            className="analysis-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ alignSelf: "center" }}
          >
            Reading resume…
          </motion.p>
        )}
        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
            <p className="analysis-stage" style={{ textAlign: "center" }}>
              Got it! ✨
            </p>
            <motion.div
              className="skill-chips"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {MOCK_SKILLS.map((s) => (
                <motion.span key={s} className="skill-chip" variants={item}>
                  {s}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="btn-row" variants={item} style={{ alignSelf: "center" }}>
        <button className="btn-primary" onClick={onContinue} disabled={stage !== "done"}>
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ===================== Screen 3: Difficulty + Live Interview ===================== */

function InterviewScreen({
  onComplete,
}: {
  onComplete: (difficulty: Difficulty, answers: Answer[]) => void;
}) {
  const [phase, setPhase] = useState<"difficulty" | "interview">("difficulty");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [qIndex, setQIndex] = useState(0);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [fallbackText, setFallbackText] = useState("");
  const askedRef = useRef(-1);

  const stt = useSpeechToText();
  const mic = useMicAnalyser();

  const questions = MOCK_QUESTIONS[difficulty];
  const question = questions[qIndex];

  useEffect(() => {
    if (phase !== "interview") return;
    if (askedRef.current === qIndex) return;
    askedRef.current = qIndex;
    setOrbState("speaking");
    speak(
      question,
      () => setOrbState("speaking"),
      () => setOrbState("idle")
    );
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  const pickDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setPhase("interview");
  };

  const startRecording = async () => {
    cancelSpeech();
    stt.reset();
    setFallbackText("");
    const ok = await mic.start();
    if (ok) setOrbState("listening");
    if (stt.supported) stt.start();
  };

  const submitAnswer = () => {
    stt.stop();
    mic.stop();
    const transcript = stt.supported ? stt.transcript : fallbackText;
    const mockScore = 5 + Math.round(Math.random() * 5);
    const newAnswer: Answer = {
      question,
      transcript: transcript || "(no answer captured)",
      score: mockScore,
      reasoning:
        mockScore >= 8
          ? "Specific, well-structured, and directly answered the question."
          : mockScore >= 6
          ? "Reasonable answer but could use a more concrete example."
          : "Answer was vague or incomplete — worth revisiting with a clearer structure.",
    };
    const next = [...answers, newAnswer];
    setAnswers(next);
    setOrbState("idle");

    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
    } else {
      onComplete(difficulty, next);
    }
  };

  if (phase === "difficulty") {
    return (
      <motion.div className="screen" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <Orb state="idle" />
        </motion.div>
        <motion.h2 className="headline" variants={item} style={{ fontSize: 24 }}>
          Pick your difficulty
        </motion.h2>
        <motion.p className="tagline" variants={item} style={{ marginTop: 4 }}>
          You can always come back and try a harder one.
        </motion.p>

        <motion.div className="difficulty-grid" variants={item}>
          {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`difficulty-card ${DIFFICULTY_META[d].className}`}
              onClick={() => pickDifficulty(d)}
            >
              <span className="d-title">{DIFFICULTY_META[d].title}</span>
              <span className="d-desc">{DIFFICULTY_META[d].desc}</span>
            </button>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="screen" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <Orb state={orbState} level={mic.level} />
      </motion.div>

      <motion.div className="progress-dots" variants={item}>
        {questions.map((_, i) => (
          <span
            key={i}
            className={`progress-dot ${i < qIndex ? "done" : i === qIndex ? "current" : ""}`}
          />
        ))}
      </motion.div>
      <motion.p className="tagline" variants={item} style={{ marginTop: 6 }}>
        Question {qIndex + 1} of {questions.length}
      </motion.p>

      <motion.div className="question-card" variants={item}>
        <AnimatePresence mode="wait">
          <motion.p
            key={qIndex}
            className="question-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {question}
          </motion.p>
        </AnimatePresence>

        {orbState === "listening" && (
          <div className="waveform">
            {mic.bars.map((b, i) => (
              <span key={i} className="waveform-bar" style={{ height: `${6 + b * 34}px` }} />
            ))}
          </div>
        )}

        {orbState === "listening" && (
          <div className="transcript-box">
            {stt.supported ? (
              <>
                {stt.transcript || "Listening…"} <span className="interim">{stt.interim}</span>
              </>
            ) : (
              "Live captions unavailable — type your answer below."
            )}
          </div>
        )}

        {orbState === "listening" && !stt.supported && (
          <input
            type="text"
            className="fallback-input"
            placeholder="Type your answer…"
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
          />
        )}

        {!stt.supported && orbState !== "listening" && (
          <p className="fallback-note">
            Speech recognition isn't supported in this browser — you'll be able to type your answer instead.
          </p>
        )}

        {orbState === "listening" ? (
          <button className="record-btn" onClick={submitAnswer} aria-label="Stop recording">
            <span className="record-icon" />
          </button>
        ) : (
          <button
            className="record-btn"
            onClick={startRecording}
            disabled={orbState === "speaking"}
            aria-label="Start recording"
          >
            <span className="record-icon dot" />
          </button>
        )}
      </motion.div>

      {mic.error && <p className="mic-error">{mic.error}</p>}
    </motion.div>
  );
}

/* ===================== Screen 4: Results ===================== */

function ResultsScreen({
  difficulty,
  answers,
  onRestart,
}: {
  difficulty: Difficulty;
  answers: Answer[];
  onRestart: () => void;
}) {
  const finalScore = useMemo(() => {
    const avg = answers.reduce((s, a) => s + a.score, 0) / (answers.length || 1);
    return Math.round((avg / 10) * 100);
  }, [answers]);
  const passed = finalScore >= 65;

  const [displayScore, setDisplayScore] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1000;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplayScore(Math.round(finalScore * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [finalScore]);

  const strengths = [
    "Clear, structured answers on the warm-up questions",
    "Confident tone with steady pacing",
    "Concrete examples on at least one behavioral question",
  ];
  const improvements = [
    "Add more specifics (numbers, outcomes) to technical answers",
    "Watch pacing on harder questions — a few long pauses",
    "Close answers with a clear takeaway",
  ];

  return (
    <motion.div className="screen" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <Orb state="idle" />
      </motion.div>
      <motion.p className="tagline" variants={item}>
        {DIFFICULTY_META[difficulty].title} interview, complete
      </motion.p>

      <motion.div className="score-ring-wrap" variants={item}>
        <svg width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r="76" fill="none" stroke="var(--border)" strokeWidth="10" />
          <motion.circle
            cx="84"
            cy="84"
            r="76"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 76}
            initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - finalScore / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
            transform="rotate(-90 84 84)"
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--saffron)" />
              <stop offset="100%" stopColor="var(--magenta)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="score-value">
          <span className="score-number">{displayScore}</span>
          <span className="score-label">out of 100</span>
        </div>
      </motion.div>

      <motion.span
        className={`verdict-badge ${passed ? "pass" : "fail"}`}
        variants={item}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.5 }}
      >
        {passed ? "✓ Pass" : "Needs work"}
      </motion.span>

      <motion.div className="qa-list" variants={item}>
        {answers.map((a, i) => (
          <div className="qa-item" key={i}>
            <button className="qa-item-head" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
              <span>Q{i + 1}. {a.question.length > 46 ? a.question.slice(0, 46) + "…" : a.question}</span>
              <span className="qa-score-pill">{a.score}/10</span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  className="qa-item-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <p><strong>Your answer:</strong> {a.transcript}</p>
                  <p style={{ marginTop: 6 }}>{a.reasoning}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      <motion.div className="checklist" variants={item}>
        <motion.div className="checklist-col strengths" variants={container} initial="hidden" animate="show">
          <h3>Strengths</h3>
          {strengths.map((s, i) => (
            <motion.div className="checklist-item" key={i} variants={item}>
              <span className="mark">✓</span>
              <span>{s}</span>
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="checklist-col improve" variants={container} initial="hidden" animate="show">
          <h3>Improve</h3>
          {improvements.map((s, i) => (
            <motion.div className="checklist-item" key={i} variants={item}>
              <span className="mark">→</span>
              <span>{s}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className="btn-row" variants={item}>
        <button className="btn-primary" onClick={onRestart}>
          Restart Interview
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ===================== App ===================== */

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [answers, setAnswers] = useState<Answer[]>([]);

  const restart = () => {
    setAnswers([]);
    setScreen("welcome");
  };

  return (
    <div className="app-shell" data-theme={theme === "light" ? "light" : undefined}>
      <div className="app-topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 26 26" width="26" height="26">
              <circle cx="13" cy="13" r="12" fill="none" stroke="url(#topgrad)" strokeWidth="2" />
              <defs>
                <linearGradient id="topgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff9142" />
                  <stop offset="100%" stopColor="#e93d82" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          PrashnAI
        </div>
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
      </div>

      <AnimatePresence mode="wait">
        {screen === "welcome" && (
          <motion.div key="welcome" {...screenTransition}>
            <WelcomeScreen onContinue={() => setScreen("resume")} />
          </motion.div>
        )}
        {screen === "resume" && (
          <motion.div key="resume" {...screenTransition}>
            <ResumeScreen onContinue={() => setScreen("interview")} />
          </motion.div>
        )}
        {screen === "interview" && (
          <motion.div key="interview" {...screenTransition}>
            <InterviewScreen
              onComplete={(d, a) => {
                setDifficulty(d);
                setAnswers(a);
                setScreen("results");
              }}
            />
          </motion.div>
        )}
        {screen === "results" && (
          <motion.div key="results" {...screenTransition}>
            <ResultsScreen difficulty={difficulty} answers={answers} onRestart={restart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
