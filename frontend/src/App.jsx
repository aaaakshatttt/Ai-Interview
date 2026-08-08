import { useState } from "react";
import "./App.css";

function App() {
  const [step, setStep] = useState("resume");
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF resume.");
      return;
    }

    setResume(file);
  };

  const handleResumeContinue = () => {
    if (!resume) {
      alert("Please upload your resume first.");
      return;
    }

    setStep("job");
  };

  const handleStartInterview = () => {
    if (!jobDescription.trim()) {
      alert("Please enter the job description.");
      return;
    }

    // For now we are only moving to the interview screen.
    // The AI/backend will be connected later.

    setStep("interview");
  };

  /*
   * ==========================
   * RESUME SCREEN
   * ==========================
   */

  if (step === "resume") {
    return (
      <div className="app">

        <div className="interviewer-card">

          <div className="icon">
            🤖
          </div>

          <h1>AI Interviewer</h1>

          <p className="subtitle">
            Let's get to know you before we begin.
          </p>

          <div className="upload-section">

            <h2>Upload your resume</h2>

            <p>
              Upload your latest resume in PDF format.
            </p>

            <label className="upload-box">

              <span className="upload-icon">
                📄
              </span>

              <span>
                {resume
                  ? resume.name
                  : "Click to upload your resume"}
              </span>

              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                hidden
              />

            </label>

          </div>

          {resume && (
            <div className="success">
              ✓ Resume uploaded successfully
            </div>
          )}

          <button
            className="continue-button"
            onClick={handleResumeContinue}
          >
            Continue →
          </button>

        </div>

      </div>
    );
  }

  /*
   * ==========================
   * JOB DESCRIPTION SCREEN
   * ==========================
   */

  if (step === "job") {
    return (
      <div className="app">

        <div className="interviewer-card">

          <div className="icon">
            💼
          </div>

          <h1>Job Description</h1>

          <p className="subtitle">
            Tell me about the position you're
            interviewing for.
          </p>

          <div className="job-section">

            <h2>Paste the Job Description</h2>

            <textarea
              className="job-input"
              placeholder="Example:

We are looking for a Software Developer
with experience in JavaScript, React,
Node.js, REST APIs and SQL..."
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(event.target.value)
              }
            />

          </div>

          <button
            className="continue-button"
            onClick={handleStartInterview}
          >
            Start Interview →
          </button>

        </div>

      </div>
    );
  }

  /*
   * ==========================
   * INTERVIEW SCREEN
   * ==========================
   */

  return (
    <div className="app">

      <div className="interviewer-card">

        <div className="icon">
          🤖
        </div>

        <h1>Ready to Interview?</h1>

        <p className="subtitle">
          Your resume and job description
          have been received.
        </p>

        <div className="interview-ready">

          <p>
            The AI interviewer will now analyze
            your profile and prepare questions
            specifically for this role.
          </p>

          <strong>
            Interview preparation complete ✓
          </strong>

        </div>

        <button
          className="continue-button"
          onClick={() => alert("AI backend coming next!")}
        >
          Begin Interview 🎤
        </button>

      </div>

    </div>
  );
}

export default App;