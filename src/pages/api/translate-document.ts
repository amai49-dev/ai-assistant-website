import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import * as fs from "fs";
import axios from "axios";
import { extractPdfWithPositions, buildOverlayPdf } from "@/utils/pdfProcessor";
import { extractPptxTexts, buildTranslatedPptx } from "@/utils/pptxProcessor";

// ปิด body parser เพื่อให้ formidable จัดการ multipart/form-data เอง
export const config = {
  api: { bodyParser: false },
};

// ------------------- Helpers -------------------

function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ maxFileSize: 50 * 1024 * 1024 }); // 50MB limit
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function getFieldValue(fields: formidable.Fields, key: string): string {
  const val = fields[key];
  if (Array.isArray(val)) return String(val[0] ?? "");
  return val ? String(val) : "";
}

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

// ตรวจจับภาษาเป้าหมายจากคำสั่งของ user → return ISO-like code
function detectLanguageCode(instruction: string): string {
  const text = instruction.toLowerCase();
  const langMap: [string[], string][] = [
    [["thai", "ไทย"], "TH"],
    [["english", "อังกฤษ", "eng"], "EN"],
    [["japanese", "ญี่ปุ่น", "日本語"], "JP"],
    [["chinese", "จีน", "中文"], "CN"],
    [["korean", "เกาหลี", "한국어"], "KR"],
    [["french", "ฝรั่งเศส"], "FR"],
    [["german", "เยอรมัน"], "DE"],
    [["spanish", "สเปน"], "ES"],
  ];

  for (const [keywords, code] of langMap) {
    if (keywords.some((kw) => text.includes(kw))) return code;
  }
  return "XX";
}

// ส่ง text ไปแปลผ่าน vLLM (OpenAI-compatible API)
async function translateText(text: string, userInstruction: string): Promise<string> {
  if (!text.trim()) return "";

  const vllmUrl = process.env.VLLM_URL;
  const vllmModel = process.env.VLLM_MODEL;
  const vllmApiKey = process.env.VLLM_API_KEY;

  if (!vllmUrl || !vllmModel) {
    throw new Error("VLLM_URL and VLLM_MODEL must be set in .env.local");
  }

  const response = await axios.post(
    `${vllmUrl}/v1/chat/completions`,
    {
      model: vllmModel,
      messages: [
        {
          role: "system",
          content:
            "You are a professional document translator. Translate the given text accurately. " +
            "Preserve the original formatting, structure, bullet points, and numbering. " +
            "Return ONLY the translated text without any explanations or commentary.",
        },
        {
          role: "user",
          content: `${userInstruction}\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    },
    {
      headers: {
        ...(vllmApiKey ? { Authorization: `Bearer ${vllmApiKey}` } : {}),
        "Content-Type": "application/json",
      },
      timeout: 120000,
    },
  );

  let result: string = response.data.choices[0].message.content || "";

  // Qwen3-based models (เช่น Typhoon 2.5) อาจมี <think>...</think> tags → ลบออก
  result = result.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  return result;
}

// แยก response ที่เป็น numbered list กลับเป็น array
function parseNumberedLines(response: string, expectedCount: number): string[] {
  const lines: string[] = [];

  for (let i = 1; i <= expectedCount; i++) {
    // หา pattern "N. text" โดย text อาจมีหลายบรรทัดจน hit เลขถัดไปหรือจบ string
    const nextNum = i + 1;
    const pattern = new RegExp(
      `(?:^|\\n)\\s*${i}\\.\\s*(.+?)(?=\\n\\s*${nextNum}\\.|$)`,
      "s",
    );
    const match = response.match(pattern);
    lines.push(match ? match[1].trim() : "");
  }

  return lines;
}

// ------------------- Main Handler -------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // ดึง file จาก form data
    const uploadedFile = files.file;
    const fileObj = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    if (!fileObj) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = fileObj.originalFilename || "document";
    const ext = getExtension(originalName);
    const userMessage = getFieldValue(fields, "message") || "Translate to English";

    // ตรวจสอบประเภทไฟล์
    if (ext === ".ppt") {
      return res.status(400).json({
        error: "ไม่รองรับไฟล์ .ppt (รูปแบบเก่า) กรุณาแปลงเป็น .pptx ก่อนอัปโหลด",
      });
    }

    if (ext !== ".pdf" && ext !== ".pptx") {
      return res.status(400).json({
        error: "รองรับเฉพาะไฟล์ .pdf และ .pptx เท่านั้น",
      });
    }

    // อ่าน file buffer
    const fileBuffer = fs.readFileSync(fileObj.filepath);

    // ------------------- Stream NDJSON Progress -------------------
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Transfer-Encoding", "chunked");

    const sendEvent = (data: Record<string, any>) => {
      res.write(JSON.stringify(data) + "\n");
    };

    let outputBuffer: Uint8Array | Buffer;
    let outputFileName: string;
    let mimeType: string;

    if (ext === ".pdf") {
      // ------------------- PDF Flow (Overlay per-line) -------------------
      const pagesData = await extractPdfWithPositions(fileBuffer);
      const pagesWithText = pagesData.filter((p) => p.fullText.trim().length > 0);

      if (pagesWithText.length === 0) {
        sendEvent({ type: "error", error: "ไม่พบข้อความในไฟล์ PDF" });
        return res.end();
      }

      const total = pagesWithText.length;
      sendEvent({ type: "start", total, fileType: "pdf" });

      // แปลทีละหน้า (per-line) → overlay ทับบน PDF ต้นฉบับ
      const pageTranslations = new Map<number, { page: (typeof pagesData)[0]; translatedLines: string[] }>();

      for (let idx = 0; idx < pagesWithText.length; idx++) {
        const pageData = pagesWithText[idx];
        sendEvent({ type: "progress", page: idx + 1, total });

        const sortedLines = [...pageData.lines].sort((a, b) => b.y - a.y);
        const numberedText = sortedLines
          .map((line, i) => `${i + 1}. ${line.text}`)
          .join("\n");

        const translated = await translateText(
          numberedText,
          `${userMessage}. Translate each numbered line individually. Keep the exact same numbering format. Do not merge or reorder lines`,
        );

        const translatedLines = parseNumberedLines(translated, sortedLines.length);
        pageTranslations.set(pageData.pageIndex, { page: pageData, translatedLines });
      }

      const langCode = detectLanguageCode(userMessage);
      sendEvent({ type: "progress", page: total, total, status: "building" });
      outputBuffer = await buildOverlayPdf(fileBuffer, pageTranslations, langCode);
      outputFileName = `translated_${langCode}_${originalName}`;
      mimeType = "application/pdf";

    } else {
      // ------------------- PPTX Flow -------------------
      const slides = await extractPptxTexts(fileBuffer);

      if (slides.length === 0) {
        sendEvent({ type: "error", error: "ไม่พบข้อความในไฟล์ PPTX" });
        return res.end();
      }

      const slidesWithText = slides.filter((s) => s.texts.length > 0);
      const total = slidesWithText.length;
      sendEvent({ type: "start", total, fileType: "pptx" });

      const translations = new Map<string, string[]>();

      for (let idx = 0; idx < slidesWithText.length; idx++) {
        const slide = slidesWithText[idx];
        sendEvent({ type: "progress", page: idx + 1, total });

        const combinedText = slide.texts.join("\n---\n");
        const translatedCombined = await translateText(combinedText, userMessage);
        const translatedTexts = translatedCombined.split(/\n?---\n?/);

        const finalTexts: string[] = [];
        for (let i = 0; i < slide.texts.length; i++) {
          finalTexts.push(
            i < translatedTexts.length ? translatedTexts[i].trim() : slide.texts[i],
          );
        }
        translations.set(slide.slideFile, finalTexts);
      }

      sendEvent({ type: "progress", page: total, total, status: "building" });
      outputBuffer = await buildTranslatedPptx(fileBuffer, translations);
      const langCode = detectLanguageCode(userMessage);
      outputFileName = `translated_${langCode}_${originalName}`;
      mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }

    // ส่งผลลัพธ์สุดท้าย
    const base64Data = Buffer.from(outputBuffer).toString("base64");
    sendEvent({ type: "done", fileName: outputFileName, fileData: base64Data, mimeType });
    return res.end();

  } catch (error: any) {
    console.error("TRANSLATE ERROR:", error);
    try {
      res.write(JSON.stringify({ type: "error", error: "เกิดข้อผิดพลาดในการแปลเอกสาร", detail: error.message }) + "\n");
    } catch { /* headers already sent */ }
    return res.end();
  }
}
