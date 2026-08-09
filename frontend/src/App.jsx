import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const interviewQuestionBank = {
  frontend: {
    easy: [
      "What is the difference between HTML, CSS, and JavaScript?",
      "Explain the purpose of React components.",
      "What is the difference between props and state?",
    ],
    medium: [
      "How do you optimize re-renders in a React application?",
      "Explain useEffect and common pitfalls when using it.",
      "How would you structure a scalable frontend codebase?",
    ],
    hard: [
      "How would you design a high-performance frontend for a large-scale app?",
      "Explain how you would handle state synchronization across multiple views.",
      "What trade-offs would you consider when choosing SSR, CSR, or hydration strategies?",
    ],
  },
  backend: {
    easy: [
      "What is an API?",
      "What is the difference between GET and POST requests?",
      "What is middleware in a backend server?",
    ],
    medium: [
      "How do you design a RESTful API?",
      "What is authentication and how is it different from authorization?",
      "How do you handle errors in a Node.js backend?",
    ],
    hard: [
      "How would you design a scalable backend for millions of requests?",
      "How do you prevent race conditions in concurrent systems?",
      "What strategies would you use for caching and rate limiting?",
    ],
  },
  data: {
    easy: [
      "What is the difference between data and information?",
      "What is a CSV file used for?",
      "Explain basic data cleaning.",
    ],
    medium: [
      "How do you handle missing values in a dataset?",
      "What is the difference between structured and unstructured data?",
      "How would you explain a data pipeline?",
    ],
    hard: [
      "How would you design an analytics pipeline for real-time dashboards?",
      "What techniques would you use for feature engineering?",
      "How do you detect and mitigate data drift in production?",
    ],
  },
  general: {
    easy: [
      "Tell me about your recent work experience.",
      "What are your key strengths?",
      "Why do you want this role?",
    ],
    medium: [
      "Describe a challenging project you worked on.",
      "How do you approach learning a new technology?",
      "How do you handle deadlines and priorities?",
    ],
    hard: [
      "Tell me about a time you improved a process or system significantly.",
      "How do you handle ambiguous requirements in a project?",
      "Describe a technical decision you disagreed with and how you handled it.",
    ],
  },
};

const interviewTypes = ["Easy", "Medium", "Hard"];

const companyQuestionByDifficulty = {
  easy: "Do you have any questions?",
  medium: "Do you have any questions?",
  hard: "Do you have any questions?",
};

const extractProjectNameFromResume = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const labeledLine = lines.find((line) =>
    /project\s*(name)?\s*[:\-]/i.test(line),
  );

  if (labeledLine) {
    const extracted = labeledLine.split(/[:\-]/).slice(1).join("-").trim();

    if (extracted) return extracted;
  }

  const projectLine = lines.find(
    (line) => /project/i.test(line) && line.length > 8 && line.length < 80,
  );

  if (projectLine) {
    return projectLine.replace(/^[•\-*\d.\s]+/, "").trim();
  }

  return "one of your projects";
};

const getAssistantAnswer = (question, role, difficulty) => {
  const normalizedQuestion = question.toLowerCase();
  const normalizedRole = role.trim().toLowerCase();
  const normalizedDifficulty = difficulty.toLowerCase();

  if (!normalizedQuestion) {
    return "Ask me anything about the interview, role, or project.";
  }

  if (
    normalizedQuestion.includes("project") ||
    normalizedQuestion.includes("resume")
  ) {
    return `You can explain the project by describing the problem, your role, the tools you used, and the outcome. Connect it back to your ${normalizedRole || "chosen"} role where possible.`;
  }

  if (
    normalizedQuestion.includes("why") ||
    normalizedQuestion.includes("join")
  ) {
    return `Talk about your motivation, what interested you in this role, and how this ${normalizedDifficulty} interview helps you show your strengths.`;
  }

  if (
    normalizedQuestion.includes("strength") ||
    normalizedQuestion.includes("weakness")
  ) {
    return "Choose one or two honest strengths with short examples. For weaknesses, mention how you are improving them.";
  }

  if (normalizedQuestion.includes("salary")) {
    return "Salary questions are usually best answered with a market-aware range and flexibility based on role, scope, and location.";
  }

  if (
    normalizedQuestion.includes("interview") ||
    normalizedQuestion.includes("question")
  ) {
    return `For a ${normalizedDifficulty} interview, keep answers specific, structured, and tied to your role examples.`;
  }

  return "I would suggest answering with a short structure: context, what you did, the result, and one thing you learned.";
};

const getCompanyReplySuggestion = (role, difficulty) => {
  const normalizedRole = role.trim().toLowerCase();
  const normalizedDifficulty = difficulty.toLowerCase();

  const roleFocus =
    normalizedRole.includes("frontend") || normalizedRole.includes("ui")
      ? "frontend team structure and product roadmap"
      : normalizedRole.includes("backend") || normalizedRole.includes("api")
        ? "backend architecture and scalability expectations"
        : normalizedRole.includes("data") || normalizedRole.includes("analyst")
          ? "data workflows and impact metrics"
          : "day-to-day responsibilities and growth opportunities";

  return `Thank you. I would love to know more about ${roleFocus}, how success is measured in this ${normalizedDifficulty} interview role, and what the next steps are after this round.`;
};

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);

const getGrade = (score) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
};

const getScoreBarStyle = (score) => {
  if (score >= 85) {
    return {
      background: "linear-gradient(90deg, #22c55e, #10b981)",
      boxShadow: "0 10px 22px rgba(34, 197, 94, 0.24)",
    };
  }

  if (score >= 70) {
    return {
      background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
      boxShadow: "0 10px 22px rgba(59, 130, 246, 0.22)",
    };
  }

  if (score >= 40) {
    return {
      background: "linear-gradient(90deg, #f59e0b, #eab308)",
      boxShadow: "0 10px 22px rgba(245, 158, 11, 0.22)",
    };
  }

  return {
    background: "linear-gradient(90deg, #ef4444, #f97316)",
    boxShadow: "0 10px 22px rgba(239, 68, 68, 0.22)",
  };
};

const calculateTechnicalCommunication = (answers) => {
  if (!answers.length) return 0;

  const total = answers.reduce((sum, entry) => {
    const lengthBonus = Math.min(
      entry.answer.split(/\s+/).filter(Boolean).length,
      80,
    );
    const structureBonus =
      entry.answer.split(/[.!?]/).filter((part) => part.trim()).length > 1
        ? 10
        : 0;
    const clarityBonus = /because|therefore|so|for example|in my project/i.test(
      entry.answer,
    )
      ? 12
      : 0;

    return (
      sum +
      clamp(
        Math.round(
          entry.score * 0.55 +
            lengthBonus * 0.25 +
            structureBonus +
            clarityBonus,
        ),
        0,
        100,
      )
    );
  }, 0);

  return Math.round(total / answers.length);
};

const calculateConfidence = (answers) => {
  if (!answers.length) return 0;

  const total = answers.reduce((sum, entry) => {
    const words = entry.answer.split(/\s+/).filter(Boolean).length;
    const confidentLanguage =
      /i built|i led|i handled|i improved|i designed|i developed|i contributed/i.test(
        entry.answer,
      )
        ? 18
        : 0;
    const calmStructure =
      entry.answer.split(/[.!?]/).filter((part) => part.trim()).length >= 2
        ? 8
        : 0;

    return (
      sum +
      clamp(
        Math.round(28 + words * 0.55 + confidentLanguage + calmStructure),
        0,
        100,
      )
    );
  }, 0);

  return Math.round(total / answers.length);
};

const scoreAnswer = (answer, question) => {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const answerLower = answer.toLowerCase();
  const questionLower = question.toLowerCase();

  const keywords = [
    "because",
    "built",
    "developed",
    "implemented",
    "designed",
    "handled",
    "improved",
    "learned",
    "team",
    "project",
    "api",
    "react",
    "node",
    "data",
    "testing",
    "challenge",
    "solution",
    "performance",
  ];

  const keywordHits = keywords.filter((keyword) =>
    answerLower.includes(keyword),
  ).length;

  let score = 34;

  if (words >= 10) score += 14;
  if (words >= 25) score += 14;
  if (words >= 45) score += 10;
  if (words >= 70) score += 6;

  score += Math.min(20, keywordHits * 4);

  if (/[.?!]/.test(answer)) score += 5;
  if (answer.split(/[.!?]/).filter((part) => part.trim()).length > 1) {
    score += 4;
  }

  if (questionLower.includes("why") && answerLower.includes("because")) {
    score += 6;
  }

  return clamp(Math.round(score), 0, 100);
};

function App() {
  const [step, setStep] = useState("resume");

  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [jobPreference, setJobPreference] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerHistory, setAnswerHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [questionHistory, setQuestionHistory] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentQuestion = interviewQuestions[currentQuestionIndex];

    if (
      step === "interview" &&
      currentQuestion?.source === "company" &&
      !currentAnswer
    ) {
      setCurrentAnswer(getCompanyReplySuggestion(jobPreference, interviewType));
    }
  }, [
    currentAnswer,
    currentQuestionIndex,
    interviewQuestions,
    interviewType,
    jobPreference,
    step,
  ]);

  const acceptedResumeTypes =
    ".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf";

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    updateResumeFile(file);
  };

  const updateResumeFile = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "doc", "docx", "txt", "rtf"];

    if (!allowedExtensions.includes(extension)) {
      alert("Please upload a PDF, DOC, DOCX, TXT, or RTF resume.");
      return;
    }

    setResume(file);
  };

  const handleResumeDrop = (event) => {
    event.preventDefault();
    setIsDraggingResume(false);

    const file = event.dataTransfer.files[0];
    updateResumeFile(file);
  };

  const handleResumeContinue = async () => {
    if (!resume) {
      alert("Please upload your resume first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("resume", resume);

      const response = await axios.post("/api/upload-resume", formData);

      if (response.data?.success) {
        alert("Resume uploaded successfully!");
        const parsedResumeText = response.data.resumeText || "";
        setResumeText(parsedResumeText);
        setProjectName(extractProjectNameFromResume(parsedResumeText));
      }

      setStep("job");
    } catch (error) {
      console.error("Upload error:", error);

      alert(error.response?.data?.message || "Failed to upload resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleJobContinue = () => {
    if (!jobPreference.trim()) {
      alert("Please enter your job preference.");
      return;
    }

    setStep("difficulty");
  };

  const handleStartInterview = () => {
    if (!interviewType) {
      alert("Please choose an interview type.");
      return;
    }

    setInterviewQuestions(
      buildInterviewQuestions(jobPreference, interviewType),
    );
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setAnswerHistory([]);
    setStep("interview");
  };

  const restartFlow = () => {
    setStep("resume");
    setResume(null);
    setJobPreference("");
    setInterviewType("");
    setResumeText("");
    setProjectName("");
    setInterviewQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setAnswerHistory([]);
    setUserQuestion("");
    setAssistantAnswer("");
    setQuestionHistory([]);
    setLoading(false);
  };

  const buildInterviewQuestions = (role, difficulty) => {
    const difficultyKey = difficulty.toLowerCase();

    const resumeQuestions = buildResumeQuestions(resumeText);
    const companyQuestion =
      companyQuestionByDifficulty[difficultyKey] ||
      companyQuestionByDifficulty.easy;

    const selectedResumeQuestions = resumeQuestions.slice(0, 3);

    return [...selectedResumeQuestions, companyQuestion].map(
      (question, index) => ({
        question,
        source: index < selectedResumeQuestions.length ? "resume" : "company",
      }),
    );
  };

  const buildResumeQuestions = (text) => {
    const normalizedText = text.toLowerCase();
    const projectSignals = ["project", "built", "developed", "implemented"];
    const hasProjectContext = projectSignals.some((signal) =>
      normalizedText.includes(signal),
    );

    const selectedProjectName =
      projectName || extractProjectNameFromResume(text);

    const firstQuestion = hasProjectContext
      ? `What is the name of your project ${selectedProjectName} and what did you do in it?`
      : "What is the name of the project you worked on, and what did you do in it?";

    return [
      firstQuestion,
      `What did you learn from ${selectedProjectName}?`,
      "Why did you want to work on that kind of work?",
      `What would you improve if you revisited ${selectedProjectName}?`,
    ];
  };

  const handleQuestionSubmit = () => {
    if (!currentAnswer.trim()) {
      alert("Please enter an answer before continuing.");
      return;
    }

    const question = interviewQuestions[currentQuestionIndex]?.question || "";
    const score = scoreAnswer(currentAnswer, question);

    setAnswerHistory((currentHistory) => [
      ...currentHistory,
      {
        question,
        answer: currentAnswer.trim(),
        score,
        grade: getGrade(score),
        source: interviewQuestions[currentQuestionIndex]?.source || "role",
      },
    ]);
    setCurrentAnswer("");

    if (currentQuestionIndex >= interviewQuestions.length - 1) {
      setStep("results");
      return;
    }

    setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
  };

  const handleUserQuestionSubmit = () => {
    if (!userQuestion.trim()) {
      alert("Please type your question first.");
      return;
    }

    const reply = getAssistantAnswer(
      userQuestion,
      jobPreference,
      interviewType,
    );

    setQuestionHistory((currentHistory) => [
      ...currentHistory,
      {
        question: userQuestion.trim(),
        answer: reply,
      },
    ]);
    setAssistantAnswer(reply);
    setUserQuestion("");
  };

  const progressMap = {
    resume: 1,
    job: 2,
    difficulty: 3,
    interview: 4,
    results: 5,
  };

  const progressValue = progressMap[step];
  const totalScore =
    answerHistory.length > 0
      ? Math.round(
          answerHistory.reduce((sum, entry) => sum + entry.score, 0) /
            answerHistory.length,
        )
      : 0;
  const totalGrade = getGrade(totalScore);
  const technicalCommunicationScore =
    calculateTechnicalCommunication(answerHistory);
  const confidenceScore = calculateConfidence(answerHistory);

  const closingMessage =
    "All the best, and thank you for choosing us. Keep practicing and stay confident for your next interview.";

  const questionChartData = answerHistory.map((entry, index) => ({
    label: `Q${index + 1}`,
    score: entry.score,
    grade: entry.grade,
  }));

  return (
    <div className="app-shell">
      <div className="hero-panel">
        <div className="brand-pill">AI Interviewer</div>

        <h1>Prepare your interview in one place</h1>

        <p>
          Upload your resume, choose the role you want to target, and pick the
          interview difficulty before starting.
        </p>

        <div className="progress-track" aria-label="Interview setup progress">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={
                item <= progressValue ? "progress-step active" : "progress-step"
              }
            />
          ))}
        </div>

        <div className="preview-card">
          <h2>Current setup</h2>

          <ul>
            <li>
              <strong>Resume:</strong> {resume ? resume.name : "Not uploaded"}
            </li>
            <li>
              <strong>Parsed resume:</strong> {resumeText ? "Ready" : "Pending"}
            </li>
            <li>
              <strong>Project picked:</strong>{" "}
              {projectName || "Not extracted yet"}
            </li>
            <li>
              <strong>Job preference:</strong> {jobPreference || "Not selected"}
            </li>
            <li>
              <strong>Interview type:</strong> {interviewType || "Not selected"}
            </li>
          </ul>
        </div>
      </div>

      <div className="interviewer-card">
        {step === "resume" && (
          <>
            <div className="step-label">Step 1 of 3</div>
            <h2>Upload your resume</h2>
            <p className="card-copy">
              Drag and drop your resume here, or click to browse.
            </p>

            <label
              className={
                isDraggingResume ? "upload-box drag-active" : "upload-box"
              }
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingResume(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingResume(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingResume(false);
              }}
              onDrop={handleResumeDrop}
            >
              <span className="upload-icon">📄</span>

              <span>
                {resume
                  ? resume.name
                  : "Drop your resume here or click to upload"}
              </span>

              <small className="upload-hint">
                PDF, DOC, DOCX, TXT, and RTF supported
              </small>

              <input
                type="file"
                accept={acceptedResumeTypes}
                onChange={handleResumeUpload}
                hidden
              />
            </label>

            {resume && <div className="success">✓ Resume selected</div>}

            <button
              className="continue-button"
              onClick={handleResumeContinue}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Continue to job preference →"}
            </button>
          </>
        )}

        {step === "job" && (
          <>
            <div className="step-label">Step 2 of 3</div>
            <h2>Choose your job preference</h2>
            <p className="card-copy">
              Tell us what kind of role you are preparing for.
            </p>

            <input
              className="text-input"
              type="text"
              placeholder="e.g. Frontend Developer, Backend Developer, Data Analyst"
              value={jobPreference}
              onChange={(event) => setJobPreference(event.target.value)}
            />

            <div className="button-row">
              <button className="secondary-button" onClick={restartFlow}>
                Start over
              </button>

              <button className="continue-button" onClick={handleJobContinue}>
                Continue to interview type →
              </button>
            </div>
          </>
        )}

        {step === "difficulty" && (
          <>
            <div className="step-label">Step 3 of 3</div>
            <h2>Select interview type</h2>
            <p className="card-copy">
              Choose the difficulty level for the interview session.
            </p>

            <div className="difficulty-grid">
              {interviewTypes.map((type) => (
                <button
                  key={type}
                  className={
                    interviewType === type
                      ? "difficulty-option active"
                      : "difficulty-option"
                  }
                  onClick={() => setInterviewType(type)}
                  type="button"
                >
                  <span>{type}</span>
                </button>
              ))}
            </div>

            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setStep("job")}
              >
                Back
              </button>

              <button
                className="continue-button"
                onClick={handleStartInterview}
              >
                Start interview
              </button>
            </div>
          </>
        )}

        {step === "ready" && <></>}

        {step === "interview" && (
          <>
            <div className="step-label">Interview Bot</div>
            <h2>Question {currentQuestionIndex + 1}</h2>
            <p className="card-copy">
              Based on your role as <strong>{jobPreference}</strong> and a
              <strong> {interviewType.toLowerCase()}</strong> interview level,
              here is your next question.
            </p>

            {interviewQuestions[currentQuestionIndex]?.source === "company" && (
              <div className="success company-note">
                This is the final feedback question. A suggested reply has been
                added for you, and you can still ask the bot any follow-up
                questions below.
              </div>
            )}

            <div className="chat-panel">
              <div className="chat-bubble bot-bubble">
                {interviewQuestions[currentQuestionIndex]?.question}
              </div>

              <textarea
                className="answer-input"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(event) => setCurrentAnswer(event.target.value)}
              />

              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => {
                    if (currentQuestionIndex === 0) {
                      setStep("difficulty");
                      return;
                    }

                    setCurrentQuestionIndex((currentIndex) => currentIndex - 1);
                    setCurrentAnswer(
                      answerHistory[currentQuestionIndex - 1]?.answer || "",
                    );
                    setAnswerHistory((currentHistory) =>
                      currentHistory.slice(0, -1),
                    );
                  }}
                >
                  Back
                </button>

                <button
                  className="continue-button"
                  onClick={handleQuestionSubmit}
                >
                  {currentQuestionIndex >= interviewQuestions.length - 1
                    ? "Finish interview"
                    : "Next question →"}
                </button>
              </div>
            </div>

            <div className="summary-box">
              <p>
                <strong>Role:</strong> {jobPreference}
              </p>
              <p>
                <strong>Difficulty:</strong> {interviewType}
              </p>
              <p>
                <strong>Progress:</strong> {currentQuestionIndex + 1} /{" "}
                {interviewQuestions.length}
              </p>
            </div>
          </>
        )}

        {step === "results" && (
          <>
            <div className="step-label">Final Feedback Report</div>
            <h2>Your interview feedback is ready</h2>
            <p className="card-copy">
              Here is your final feedback report with marks and grades for each
              question.
            </p>

            <div className="closing-banner">
              <strong>All the best</strong>
              <span>{closingMessage}</span>
            </div>

            <div className="chart-heading">
              <h3>Live Evaluation Chart</h3>
              <p>
                The final report is based on technical performance,
                communication, and confidence. Marks are shown for each question
                along with the grade, technical communication score, and
                confidence score.
              </p>
            </div>

            <div className="results-summary">
              <div className="results-score-card muted">
                <span className="results-score-label">Technical</span>
                <strong>{totalScore}/100</strong>
                <span className="results-grade">
                  Based on question accuracy and depth
                </span>
              </div>

              <div className="results-score-card muted">
                <span className="results-score-label">Communication</span>
                <strong>{technicalCommunicationScore}/100</strong>
                <span className="results-grade">
                  Based on clarity and structure
                </span>
              </div>
            </div>

            <div className="results-summary">
              <div className="results-score-card muted">
                <span className="results-score-label">Confidence</span>
                <strong>{confidenceScore}/100</strong>
                <span className="results-grade">
                  Based on delivery and confident wording
                </span>
              </div>

              <div className="results-score-card muted">
                <span className="results-score-label">Final grade</span>
                <strong>{totalGrade}</strong>
                <span className="results-grade">Overall evaluation result</span>
              </div>
            </div>

            <div className="results-summary">
              <div className="results-score-card">
                <span className="results-score-label">Role</span>
                <strong>{jobPreference}</strong>
                <span className="results-grade">{interviewType}</span>
              </div>

              <div className="results-score-card muted">
                <span className="results-score-label">Overall score</span>
                <strong>{totalScore}/100</strong>
                <span className="results-grade">Grade {totalGrade}</span>
              </div>
            </div>

            <div className="marks-chart">
              {questionChartData.map((item) => (
                <div className="marks-row" key={item.label}>
                  <div className="marks-row-header">
                    <span>{item.label}</span>
                    <span>
                      {item.score}/100 · {item.grade}
                    </span>
                  </div>

                  <div className="marks-bar-track">
                    <div
                      className="marks-bar-fill"
                      style={{
                        width: `${item.score}%`,
                        ...getScoreBarStyle(item.score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-box">
              {answerHistory.map((entry, index) => (
                <div
                  key={`${entry.question}-${index}`}
                  className="answer-review"
                >
                  <p>
                    <strong>{`Q${index + 1}. ${entry.question}`}</strong>
                  </p>
                  <p>{entry.answer}</p>
                  <p className="answer-grade">
                    Marks: {entry.score}/100 · Grade {entry.grade}
                  </p>
                </div>
              ))}
            </div>

            <div className="button-row">
              <button className="secondary-button" onClick={restartFlow}>
                Start new interview
              </button>
            </div>

            <div className="qa-panel">
              <div className="qa-header">
                <h3>Do you have any questions?</h3>
                <p>
                  You can still ask follow-up questions here and the bot will
                  answer them.
                </p>
              </div>

              <textarea
                className="answer-input qa-input"
                placeholder="Ask about the role, project, or interview..."
                value={userQuestion}
                onChange={(event) => setUserQuestion(event.target.value)}
              />

              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={handleUserQuestionSubmit}
                >
                  Ask bot
                </button>
              </div>

              {assistantAnswer && (
                <div className="chat-thread">
                  <div className="chat-bubble user-bubble">
                    {questionHistory[questionHistory.length - 1]?.question}
                  </div>
                  <div className="chat-bubble bot-bubble">
                    {assistantAnswer}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
