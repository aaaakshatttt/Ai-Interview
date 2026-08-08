const express = require("express");
const multer = require("multer");
const fs = require("node:fs/promises");
const { analyzeResume } = require("./resumeAnalyzer");

const app = express();

const upload = multer({
    dest: "uploads/",
});

const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "AI Interviewer backend is running",
    });
});

app.post("/api/resume/analyze", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No resume file uploaded",
            });
        }

        const result = await analyzeResume(req.file.path);

await fs.unlink(req.file.path);

res.json(result);
    } catch (error) {
        console.error("Resume analysis failed:", error);

        res.status(500).json({
            error: "Failed to analyze resume",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});