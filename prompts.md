# AI Interviewer — Master Project Prompts

## 1. Project Overview

Build an AI-powered interviewer chatbot.

The system should simulate a real technical/job interview by first collecting the candidate's resume and the target job description, then dynamically asking interview questions and evaluating the candidate's answers.

The project is being developed as a feature branch:

feature/ai-interviewer

This branch will later be merged into:

main

Do not make changes directly to main.

---

# 2. Core User Flow

The complete application flow should be:

1. User opens AI Interviewer.
2. User uploads their resume in PDF format.
3. Backend receives the resume.
4. Backend extracts the resume text.
5. User provides/pastes the Job Description.
6. Backend/AI analyzes:
   - Resume
   - Job Description
7. AI generates an interview strategy.
8. Interview starts.
9. AI asks Question 1.
10. User answers.
11. Backend evaluates the answer.
12. Evaluation should consider:
    - Expected keywords
    - Expected concepts
    - Technical correctness
    - Relevance
    - Completeness
    - Quality of explanation
13. Score is generated.
14. AI asks the next question.
15. Continue until the interview is completed.
16. Generate a final interview report.

---

# 3. Expected Interview Experience

The chatbot should behave like a real interviewer.

The interviewer should:

- Ask one question at a time.
- Wait for the candidate's answer.
- Avoid revealing the expected answer before evaluation.
- Ask follow-up questions when appropriate.
- Adapt questions based on the candidate's resume and job description.
- Increase/decrease difficulty based on performance.
- Avoid repeatedly asking the same question.
- Maintain interview state.
- Give professional interviewer-style responses.

Example:

AI:

"Tell me about your experience with React."

Candidate:

"I have used React to build..."

AI:

Evaluate the answer internally.

Then:

"Good. Now let's go deeper. Can you explain how you would manage state in a large React application?"

---

# 4. Resume Processing

The frontend should allow:

- PDF upload
- File validation
- Upload progress/loading state
- Error handling

Backend endpoint:

POST /api/upload-resume

The backend should:

1. Receive the PDF.
2. Validate the uploaded file.
3. Temporarily store/process it.
4. Extract text.
5. Return the extracted resume text.
6. Delete temporary uploaded files when appropriate.

Do NOT commit uploaded resumes to GitHub.

---

# 5. Job Description

The frontend should provide a Job Description text area.

The user should be able to paste a complete job description.

The backend/AI should extract:

- Job title
- Required skills
- Preferred skills
- Technologies
- Responsibilities
- Experience requirements
- Important concepts
- Interview-relevant keywords

Example:

JavaScript
React
Node.js
REST APIs
SQL
Git
Authentication
JWT
Database design

---

# 6. Keyword-Based Evaluation

The backend must support predefined expected keywords/concepts.

Example:

const expectedKeywords = [
    "JWT",
    "authentication",
    "middleware",
    "token"
];

Candidate answer:

"JWT can be used for authentication. The token can be
validated using middleware before allowing access to protected routes."

The system should detect that important concepts were addressed.

However, keyword matching alone must NOT determine the entire score.

A candidate should not receive a high score simply by mentioning many keywords without understanding them.

Use a combination of:

1. Keyword matching
2. Concept matching
3. AI semantic evaluation
4. Technical correctness
5. Relevance
6. Completeness

---

# 7. Suggested Scoring Model

Use a configurable scoring system.

Example:

Keyword/concept coverage: 20%
Technical correctness: 30%
Relevance: 20%
Depth of explanation: 20%
Communication clarity: 10%

Total:

100 points

Example evaluation:

{
  "score": 82,
  "keywordScore": 18,
  "technicalScore": 27,
  "relevanceScore": 18,
  "depthScore": 13,
  "communicationScore": 6,
  "matchedKeywords": [
    "JWT",
    "authentication",
    "middleware"
  ],
  "missingConcepts": [
    "token expiration"
  ],
  "feedback": "Good understanding of JWT authentication..."
}

The exact scoring weights should remain configurable.

---

# 8. AI Evaluation Prompt

Use the following as a starting prompt for the evaluator:

You are an expert technical interviewer.

Evaluate the candidate's answer against the interview question and expected concepts.

Do not award points simply because keywords appear.

Determine whether the candidate demonstrates actual understanding.

Evaluate:

1. Technical correctness
2. Relevance
3. Concept coverage
4. Depth
5. Clarity
6. Completeness

Return structured JSON.

Required output:

{
  "score": 0,
  "technicalCorrectness": 0,
  "relevance": 0,
  "conceptCoverage": 0,
  "depth": 0,
  "clarity": 0,
  "matchedConcepts": [],
  "missingConcepts": [],
  "strengths": [],
  "weaknesses": [],
  "feedback": ""
}

Scores must be between 0 and 100 where applicable.

---

# 9. Question Generation Prompt

The interviewer should generate questions using:

- Resume
- Job Description
- Interview history
- Previous answers
- Previous scores
- Candidate experience level

Prompt:

You are an expert interviewer conducting a professional job interview.

Analyze the candidate's resume and the target job description.

Generate the next interview question.

The question should:

- Be relevant to the target role.
- Be connected to the candidate's resume where appropriate.
- Test an important job requirement.
- Avoid questions already asked.
- Match the candidate's current difficulty level.
- Be concise and professional.

Return:

{
  "question": "",
  "category": "",
  "difficulty": "easy|medium|hard",
  "expectedConcepts": [],
  "expectedKeywords": []
}

---

# 10. Adaptive Interviewing

The AI should adapt based on performance.

If the candidate performs well:

Increase difficulty.

If the candidate performs poorly:

Ask a simpler question or a clarifying/fundamental question.

Example:

Score > 80:
Move toward advanced questions.

Score 50–80:
Continue at the current difficulty.

Score < 50:
Ask a foundational or follow-up question.

Do not make difficulty changes solely based on keyword count.

---

# 11. Suggested Backend Structure

backend/

├── server.js
├── package.json
├── .env
├── uploads/
│
├── routes/
│   ├── resumeRoutes.js
│   ├── interviewRoutes.js
│   └── evaluationRoutes.js
│
├── controllers/
│   ├── resumeController.js
│   ├── interviewController.js
│   └── evaluationController.js
│
├── services/
│   ├── resumeService.js
│   ├── interviewService.js
│   ├── evaluationService.js
│   └── openaiService.js
│
├── data/
│   └── interviewKeywords.js
│
└── utils/

---

# 12. Suggested Frontend Structure

frontend/

├── src/
│   ├── components/
│   │   ├── ResumeUpload.jsx
│   │   ├── JobDescription.jsx
│   │   ├── InterviewChat.jsx
│   │   ├── QuestionCard.jsx
│   │   ├── AnswerBox.jsx
│   │   └── ScoreCard.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
└── package.json

---

# 13. Current Technology Stack

Frontend:

- React
- Vite
- JavaScript
- Axios
- CSS

Backend:

- Node.js
- Express
- CORS
- Multer
- pdf-parse
- OpenAI API
- dotenv

Do not introduce additional frameworks unless there is a clear reason.

---

# 14. Current Resume API

Endpoint:

POST /api/upload-resume

Expected request:

multipart/form-data

Field:

resume

Expected response:

{
  "success": true,
  "message": "Resume uploaded successfully",
  "resumeText": "..."
}

---

# 15. Environment Variables

Never hard-code API keys.

Use:

.env

Example:

OPENAI_API_KEY=your_key_here

Never commit:

.env

to GitHub.

---

# 16. Git Rules

Development branch:

feature/ai-interviewer

Main branch:

main

Normal workflow:

git checkout main
git pull origin main

git checkout -b feature/ai-interviewer

Make changes.

git status

git add .

git commit -m "feat: description"

git push -u origin feature/ai-interviewer

Then create a Pull Request:

feature/ai-interviewer -> main

Never force push unless explicitly required.

Do not commit:

node_modules/
.env
backend/.env
uploads/
*.log

---

# 17. GitHub Permission Issue

If pushing gives:

Permission to OWNER/Ai-Interview.git denied to USER.

Check:

git remote -v

If the repository belongs to a teammate, request collaborator access.

Alternatively, fork the repository and set your fork as origin.

Do not use force push to bypass repository permissions.

---

# 18. Coding Rules

When modifying the project:

1. Explain what file will be changed.
2. Give exact file path.
3. Give complete code when practical.
4. Keep changes focused on the current feature.
5. Do not rewrite unrelated files.
6. Preserve existing functionality.
7. Test after each major change.
8. Do not expose API keys.
9. Do not commit node_modules.
10. Do not commit user resumes.
11. Handle API errors properly.
12. Validate uploaded files.
13. Validate AI responses.
14. Avoid relying exclusively on keyword matching.
15. Keep AI interviewer state organized.

---

# 19. Error Handling

Frontend should handle:

- Invalid PDF
- Missing resume
- Empty job description
- Backend unavailable
- AI API failure
- Invalid AI response
- Interview timeout

Backend should return meaningful HTTP status codes and JSON messages.

Example:

{
  "success": false,
  "message": "Please upload a PDF resume."
}

---

# 20. Security

Never expose:

OPENAI_API_KEY

to the frontend.

AI API calls must happen on the backend.

Never put:

OPENAI_API_KEY

inside React/Vite client-side code.

Never commit .env.

Validate uploaded files.

Limit upload size.

Delete temporary files after processing where appropriate.

---

# 21. Master Prompt for Future AI Coding Sessions

You are working on the AI Interviewer project.

The project has a React/Vite frontend and Node.js/Express backend.

The application flow is:

Resume Upload
→ Job Description
→ Resume + Job Description Analysis
→ AI Interview
→ Candidate Answer
→ Keyword/Concept Matching
→ AI Evaluation
→ Score
→ Next Question
→ Final Interview Report

The current development branch is:

feature/ai-interviewer

Do not modify main directly.

When implementing a feature:

1. Inspect the existing architecture.
2. Reuse existing code where possible.
3. Do not unnecessarily rewrite working files.
4. Tell me exactly which files need to change.
5. Provide complete code for changed files when appropriate.
6. Keep frontend and backend responsibilities separate.
7. Keep API keys on the backend.
8. Do not commit node_modules, .env, uploads, or secrets.
9. Test the feature before moving to the next feature.
10. Keep commits small and meaningful.

The AI interviewer must use both keyword/concept matching and semantic AI evaluation.

Keyword presence alone must not determine the candidate's score.

The AI should generate questions based on:

- Resume
- Job Description
- Previous questions
- Previous answers
- Previous scores
- Candidate experience

The AI should adapt interview difficulty according to performance.

Build the project incrementally.

Do not jump ahead to advanced features until the current feature is working.

---

# 22. Development Roadmap

Phase 1:
Frontend Resume Upload

Phase 2:
Backend Resume Upload API

Phase 3:
Connect Frontend to Backend

Phase 4:
Job Description UI

Phase 5:
Job Description API

Phase 6:
Resume + JD analysis

Phase 7:
OpenAI integration

Phase 8:
Question generation

Phase 9:
Interview chat interface

Phase 10:
Answer evaluation

Phase 11:
Keyword/concept scoring

Phase 12:
Adaptive questioning

Phase 13:
Final interview report

Phase 14:
Testing

Phase 15:
Documentation

Phase 16:
Pull Request to main

---

# 23. Definition of Done

The AI Interviewer feature is complete when:

- Resume can be uploaded.
- Resume text is extracted.
- Job Description can be submitted.
- Resume and JD are sent to the AI.
- Interview questions are generated.
- Questions are displayed in chat format.
- Candidate can submit answers.
- Answers are evaluated.
- Keywords/concepts are checked.
- AI evaluates actual understanding.
- Scores are generated.
- Next questions are generated.
- Interview difficulty can adapt.
- Final score/report is generated.
- Errors are handled.
- API keys are secure.
- No node_modules are committed.
- No .env files are committed.
- Feature branch is pushed.
- Pull Request can be created to main.
