import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFParse } from "pdf-parse";

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

app.get("/", (req, res) => {
  res.json({
    message: "AI Interviewer Backend is running 🚀",
  });
});

app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a resume",
      });
    }

    const filePath = req.file.path;

    const fileBuffer = fs.readFileSync(filePath);

    const parser = new PDFParse({
      data: fileBuffer,
    });

    const result = await parser.getText();

    const resumeText = result.text;

    await parser.destroy();

    fs.unlinkSync(filePath);

    console.log("Resume received successfully");

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      resumeText,
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process resume",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
