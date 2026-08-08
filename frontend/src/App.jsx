import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF resume.");
      return;
    }

    setResume(file);
  };

  const handleContinue = () => {
    if (!resume) {
      alert("Please upload your resume first.");
      return;
    }

    console.log("Resume selected:", resume.name);

    // Next step will take the user to Job Description
  };

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
          onClick={handleContinue}
        >
          Continue →
        </button>

      </div>

    </div>
  );
}

export default App;