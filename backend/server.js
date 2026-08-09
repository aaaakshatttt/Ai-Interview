import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";

const app = express();

const PORT = 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDistPath));

const upload = multer({
  dest: "uploads/",
});

const supportedExtensions = new Set([
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".rtf",
]);

const extractTextWithTextract = (filePath) =>
  new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (error, text) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(text || "");
    });
  });

const extractResumeText = async (filePath, originalName) => {
  const extension = path.extname(originalName).toLowerCase();

  if (!supportedExtensions.has(extension)) {
    throw new Error(
      "Unsupported file type. Please upload a PDF, DOC, DOCX, TXT, or RTF file."
    );
  }

  const fileBuffer = await fsp.readFile(filePath);

  if (extension === ".pdf") {
    const parser = new PDFParse({
      data: fileBuffer,
    });

    const result = await parser.getText();
    await parser.destroy();

    return result.text;
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return result.value;
  }

  if (extension === ".txt" || extension === ".rtf" || extension === ".doc") {
    return extractTextWithTextract(filePath);
  }

  throw new Error("Unsupported file type.");
};

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a resume",
      });
    }

    const filePath = req.file.path;

    const resumeText = await extractResumeText(filePath, req.file.originalname);

    fs.unlinkSync(filePath);

    console.log("Resume received successfully");

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      resumeText,
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to process resume",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
