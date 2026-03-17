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

    let outputBuffer: Uint8Array | Buffer;
    let outputFileName: string;
    let mimeType: string;

    if (ext === ".pdf") {
      // ------------------- PDF Flow (Overlay) -------------------
      const pagesData = await extractPdfWithPositions(fileBuffer);
      const pagesWithText = pagesData.filter((p) => p.fullText.trim().length > 0);

      if (pagesWithText.length === 0) {
        return res.status(400).json({ error: "ไม่พบข้อความในไฟล์ PDF" });
      }

      // แปลทีละหน้า → overlay ทับบน PDF ต้นฉบับ
      const pageTranslations = new Map<number, { page: (typeof pagesData)[0]; translatedText: string }>();

      for (const pageData of pagesWithText) {
        const translated = await translateText(pageData.fullText, userMessage);
        pageTranslations.set(pageData.pageIndex, { page: pageData, translatedText: translated });
      }

      outputBuffer = await buildOverlayPdf(fileBuffer, pageTranslations);
      outputFileName = `translated_${originalName}`;
      mimeType = "application/pdf";

    } else {
      // ------------------- PPTX Flow -------------------
      const slides = await extractPptxTexts(fileBuffer);

      if (slides.length === 0) {
        return res.status(400).json({ error: "ไม่พบข้อความในไฟล์ PPTX" });
      }

      // แปลทีละ slide
      const translations = new Map<string, string[]>();

      for (const slide of slides) {
        if (slide.texts.length === 0) continue;

        // รวม text ทั้งหมดของ slide ส่งไปแปลพร้อมกัน (vLLM รองรับ newline)
        const combinedText = slide.texts.join("\n---\n");
        const translatedCombined = await translateText(combinedText, userMessage);

        // แยก text กลับตาม delimiter
        const translatedTexts = translatedCombined.split(/\n?---\n?/);

        // ถ้าจำนวนไม่ตรง → ใช้ผลลัพธ์ที่ได้ + เติมตัวเดิม
        const finalTexts: string[] = [];
        for (let i = 0; i < slide.texts.length; i++) {
          finalTexts.push(
            i < translatedTexts.length ? translatedTexts[i].trim() : slide.texts[i],
          );
        }

        translations.set(slide.slideFile, finalTexts);
      }

      outputBuffer = await buildTranslatedPptx(fileBuffer, translations);
      outputFileName = `translated_${originalName}`;
      mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }

    // ส่ง file กลับเป็น base64
    const base64Data = Buffer.from(outputBuffer).toString("base64");

    return res.status(200).json({
      fileName: outputFileName,
      fileData: base64Data,
      mimeType,
    });

  } catch (error: any) {
    console.error("TRANSLATE ERROR:", error);
    return res.status(500).json({
      error: "เกิดข้อผิดพลาดในการแปลเอกสาร",
      detail: error.message,
    });
  }
}
