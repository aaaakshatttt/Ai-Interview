require("dotenv").config();

const { readFile } = require("node:fs/promises");
const { PDFParse } = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function analyzeResume(filePath) {
    const data = await readFile(filePath);

    const parser = new PDFParse({ data });
    const result = await parser.getText();

    console.log(
        "Resume text extracted:",
        result.text.length,
        "characters"
    );

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: `Analyze this resume and extract information useful for conducting a technical interview.

Return ONLY valid JSON.

Use this exact structure:

{
  "candidate": {
    "name": "",
    "email": ""
  },
  "skills": [],
  "topics": [
    {
      "name": "",
      "importance": 0
    }
  ],
  "projects": [
    {
      "name": "",
      "technologies": [],
      "description": ""
    }
  ],
  "experience": [],
  "education": []
}

For "topics", identify important technical areas from the candidate's resume that an interviewer should ask about.
"importance" must be a number between 0 and 1.

Resume:
${result.text}`,

        config: {
            responseMimeType: "application/json",
        },
    });

    await parser.destroy();

    return JSON.parse(response.text);
}

module.exports = {
    analyzeResume,
};