// utils/extract.js
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";      // npm i pdf-parse
import mammoth from "mammoth";         // npm i mammoth
// (Optional for scanned PDFs) npm i tesseract.js @tesseract.js/node

export async function extractPlainText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buf = fs.readFileSync(filePath);

  if (ext === ".txt") return buf.toString("utf8");

  if (ext === ".docx") {
    // mammoth is far more reliable than manual XML stripping
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return (value || "").trim();
  }

  if (ext === ".pdf") {
    // text-based PDFs
    const out = await pdfParse(buf);
    let text = (out.text || "").trim();
    if (text.length < 300) {
      // likely scanned — OCR fallback (optional, slower)
      // const { createWorker } = await import("tesseract.js");
      // ... implement OCR per page if you really need it
    }
    return text;
  }

  // Unsupported type
  return "";
}
