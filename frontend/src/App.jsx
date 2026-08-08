import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [step, setStep] = useState("resume");

  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const [loading, setLoading] = useState(false);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF resume.");
      return;
    }

    setResume(file);
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

      const response = await axios.post(
        "http://localhost:5000/api/upload-resume",
        formData
      );

      console.log("Backend response:", response.data);

      setResumeText(response.data.resumeText);

      alert("Resume uploaded and processed successfully!");

      setStep("job");

    } catch (error) {
      console.error("Upload error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to upload resume."
      );

    } finally {
      setLoading(false);
    }
  };

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
              ✓ Resume selected
            </div>
          )}

          <button
            className="continue-button"
            onClick={handleResumeContinue}
            disabled={loading}
          >
            {loading
              ? "Processing Resume..."
              : "Continue →"}
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="app">

      <div className="interviewer-card">

        <h1>Resume Processed ✓</h1>

        <p>
          Your resume has been successfully
          sent to the backend.
        </p>

        <button
          className="continue-button"
          onClick={() => {
            console.log("Resume text:", resumeText);
            setStep("job");
          }}
        >
          Continue to Job Description →
        </button>

      </div>

    </div>
  );
}

export default App;