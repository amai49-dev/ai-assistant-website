import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as fs from "fs";
import * as path from "path";

// ------------------- Types -------------------

interface TextLine {
  text: string;
  x: number;      // PDF coords (origin bottom-left)
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface PageTextData {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  lines: TextLine[];
  bounds: { x: number; y: number; width: number; height: number };
  fullText: string; // text ทั้งหน้ารวมกัน (single line สำหรับส่ง AI)
}

// ------------------- Text Extraction with Positions -------------------
// ใช้ pdfjs-dist ตรง ๆ เพื่อดึง text พร้อมตำแหน่ง x, y, fontSize

export async function extractPdfWithPositions(buffer: Buffer): Promise<PageTextData[]> {
  // ใช้ legacy build สำหรับ Node.js (ไม่ต้องการ DOMMatrix)
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;

  const pages: PageTextData[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    // กรอง TextItem (ไม่เอา TextMarkedContent) และ text ที่ไม่ว่าง
    const textItems = textContent.items.filter(
      (item: any) => "str" in item && item.str.trim().length > 0,
    ) as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
      hasEOL: boolean;
    }>;

    if (textItems.length === 0) {
      pages.push({
        pageIndex: i - 1,
        pageWidth: viewport.width,
        pageHeight: viewport.height,
        lines: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        fullText: "",
      });
      continue;
    }

    // จัดกลุ่ม text items เป็นบรรทัด (y ใกล้กัน ± 3 units)
    const lines = groupIntoLines(textItems);

    // คำนวณ bounding box ของ text ทั้งหน้า
    const bounds = computeBounds(lines);

    // รวม text ทั้งหมดเป็น single line (ลบ newline สำหรับ webhook)
    const fullText = lines.map((l) => l.text).join(" ");

    pages.push({
      pageIndex: i - 1,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
      lines,
      bounds,
      fullText,
    });
  }

  await pdfDoc.destroy();
  return pages;
}

function groupIntoLines(
  items: Array<{ str: string; transform: number[]; width: number; height: number }>,
): TextLine[] {
  // เรียงตาม y จากบนลงล่าง (y มากสุดก่อน) แล้วตาม x จากซ้ายไปขวา
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  const lines: TextLine[] = [];
  let currentGroup: typeof sorted = [];
  let currentY: number | null = null;

  for (const item of sorted) {
    const y = item.transform[5];
    if (currentY === null || Math.abs(y - currentY) <= 3) {
      currentGroup.push(item);
      currentY = currentY ?? y;
    } else {
      if (currentGroup.length > 0) {
        lines.push(mergeLine(currentGroup));
      }
      currentGroup = [item];
      currentY = y;
    }
  }
  if (currentGroup.length > 0) {
    lines.push(mergeLine(currentGroup));
  }

  return lines;
}

function mergeLine(
  items: Array<{ str: string; transform: number[]; width: number; height: number }>,
): TextLine {
  const text = items.map((i) => i.str).join(" ");
  const x = Math.min(...items.map((i) => i.transform[4]));
  const y = items[0].transform[5];
  const fontSize = Math.abs(items[0].transform[0]) || 12;
  const maxX = Math.max(...items.map((i) => i.transform[4] + i.width));
  const width = maxX - x;
  const height = Math.max(...items.map((i) => i.height)) || fontSize;

  return { text, x, y, width, height, fontSize };
}

function computeBounds(lines: TextLine[]) {
  if (lines.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  const minX = Math.min(...lines.map((l) => l.x));
  const minY = Math.min(...lines.map((l) => l.y));
  const maxX = Math.max(...lines.map((l) => l.x + l.width));
  const maxY = Math.max(...lines.map((l) => l.y + l.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ------------------- PDF Overlay Build -------------------
// โหลด PDF ต้นฉบับ → ทับ text เดิมด้วยสีขาว → วาด text แปลแล้วทับ

export async function buildOverlayPdf(
  originalBuffer: Buffer,
  pageTranslations: Map<number, { page: PageTextData; translatedText: string }>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBuffer);
  pdfDoc.registerFontkit(fontkit);

  // โหลด font Noto Sans Thai (รองรับ Thai + Latin)
  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansThai-Regular.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pdfPages = pdfDoc.getPages();

  for (const [pageIndex, { page: pageData, translatedText }] of pageTranslations) {
    if (pageIndex >= pdfPages.length) continue;

    const pdfPage = pdfPages[pageIndex];
    const { bounds, lines } = pageData;

    if (lines.length === 0 || !translatedText.trim()) continue;

    // คำนวณ fontSize เฉลี่ยจากต้นฉบับ
    const avgFontSize = lines.reduce((sum, l) => sum + l.fontSize, 0) / lines.length;
    const baseFontSize = Math.max(Math.min(avgFontSize, 14), 8); // จำกัดขนาด 8-14pt

    // 1. วาดสี่เหลี่ยมขาวทับ text เดิม ทีละบรรทัด (รักษา image ระหว่างบรรทัด)
    const padding = 2;
    for (const line of lines) {
      pdfPage.drawRectangle({
        x: line.x - padding,
        y: line.y - line.height * 0.3 - padding,
        width: line.width + padding * 2,
        height: line.height + padding * 2,
        color: rgb(1, 1, 1),
      });
    }

    // 2. คำนวณพื้นที่ที่ใช้วาง text แปลแล้ว (เท่ากับพื้นที่ text เดิม)
    const availableHeight = bounds.height + baseFontSize;
    const maxTextWidth = Math.max(bounds.width, 100);

    // 3. Auto-shrink: ลดขนาด font จนกว่า text แปลแล้วจะพอดีกับพื้นที่เดิม (min 4pt)
    let fontSize = baseFontSize;
    let lineHeight = fontSize * 1.5;
    let wrappedLines = wrapText(translatedText, customFont, fontSize, maxTextWidth);

    while (wrappedLines.length * lineHeight > availableHeight && fontSize > 4) {
      fontSize -= 0.5;
      lineHeight = fontSize * 1.5;
      wrappedLines = wrapText(translatedText, customFont, fontSize, maxTextWidth);
    }

    // 4. วาด text ที่แปลแล้ว เริ่มจากมุมบนซ้ายของ bounding box
    let drawY = bounds.y + availableHeight - fontSize;

    for (const line of wrappedLines) {
      if (drawY < bounds.y) break; // หยุดถ้าเลยพื้นที่ด้านล่าง

      if (line.trim() === "") {
        drawY -= lineHeight * 0.5;
        continue;
      }

      try {
        pdfPage.drawText(line, {
          x: bounds.x,
          y: drawY,
          size: fontSize,
          font: customFont,
          color: rgb(0.1, 0.1, 0.1),
        });
      } catch {
        // font ไม่รองรับบาง character
      }

      drawY -= lineHeight;
    }
  }

  return pdfDoc.save();
}

// ------------------- Text Wrapping -------------------

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  // แยกด้วย newline ที่อาจมาจาก AI response
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      let testWidth: number;

      try {
        testWidth = font.widthOfTextAtSize(testLine, fontSize);
      } catch {
        testWidth = testLine.length * fontSize * 0.5;
      }

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}
