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
  // ใช้ unpdf (serverless build ของ PDF.js -- ไม่ต้องการ canvas/DOMMatrix)
  const { getDocumentProxy } = await import("unpdf");
  const pdfDoc = await getDocumentProxy(new Uint8Array(buffer));

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
        // แยก column ก่อน merge เป็น lines
        lines.push(...splitColumnsAndMerge(currentGroup));
      }
      currentGroup = [item];
      currentY = y;
    }
  }
  if (currentGroup.length > 0) {
    lines.push(...splitColumnsAndMerge(currentGroup));
  }

  return lines;
}

// ตรวจจับ column: ถ้า items ใน y-group เดียวกันมี x-gap ใหญ่ → แยกเป็นหลาย TextLine
function splitColumnsAndMerge(
  items: Array<{ str: string; transform: number[]; width: number; height: number }>,
): TextLine[] {
  if (items.length <= 1) return [mergeLine(items)];

  // เรียงตาม x จากซ้ายไปขวา
  const sorted = [...items].sort((a, b) => a.transform[4] - b.transform[4]);

  // คำนวณ average character width เพื่อใช้เป็น threshold
  const avgCharWidth = sorted.reduce(
    (sum, i) => sum + (i.width / Math.max(i.str.length, 1)), 0,
  ) / sorted.length;
  const gapThreshold = Math.max(avgCharWidth * 5, 30); // gap > 5x ตัวอักษร = column break

  // แยก segments ตาม x-gap
  const segments: (typeof sorted)[] = [[]];
  for (let i = 0; i < sorted.length; i++) {
    segments[segments.length - 1].push(sorted[i]);
    if (i < sorted.length - 1) {
      const currentEnd = sorted[i].transform[4] + sorted[i].width;
      const nextStart = sorted[i + 1].transform[4];
      const gap = nextStart - currentEnd;
      if (gap > gapThreshold) {
        segments.push([]); // เริ่ม column ใหม่
      }
    }
  }

  return segments.filter((s) => s.length > 0).map(mergeLine);
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

// ------------------- PDF Overlay Build (Per-Line) -------------------
// โหลด PDF ต้นฉบับ → ทับ text เดิมด้วยสีขาวทีละบรรทัด → วาด text แปลแล้วที่ตำแหน่งเดิม

export async function buildOverlayPdf(
  originalBuffer: Buffer,
  pageTranslations: Map<number, { page: PageTextData; translatedLines: string[] }>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBuffer);
  pdfDoc.registerFontkit(fontkit);

  // โหลด font Noto Sans Thai (รองรับ Thai + Latin)
  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansThai-Regular.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pdfPages = pdfDoc.getPages();

  for (const [pageIndex, { page: pageData, translatedLines }] of pageTranslations) {
    if (pageIndex >= pdfPages.length) continue;

    const pdfPage = pdfPages[pageIndex];
    const { lines } = pageData;

    // เรียง lines จากบนลงล่าง (เหมือนลำดับที่ส่งไปแปล)
    const sortedLines = [...lines].sort((a, b) => b.y - a.y);

    if (sortedLines.length === 0) {
      console.log(`[PDF] Page ${pageIndex}: skipped (no lines)`);
      continue;
    }

    console.log(`[PDF] Page ${pageIndex}: ${sortedLines.length} lines, ${translatedLines.length} translations`);

    let drawnCount = 0;
    let errorCount = 0;
    const padding = 2;

    for (let i = 0; i < sortedLines.length; i++) {
      const origLine = sortedLines[i];
      const translated = (translatedLines[i] || "").trim();

      if (!translated) continue;

      // 1. วาดสี่เหลี่ยมขาวทับ text เดิมที่ตำแหน่งนี้
      pdfPage.drawRectangle({
        x: origLine.x - padding,
        y: origLine.y - origLine.height * 0.3 - padding,
        width: origLine.width + padding * 2,
        height: origLine.height + padding * 2,
        color: rgb(1, 1, 1),
      });

      // 2. คำนวณ fontSize ให้พอดีกับความกว้างของ original line
      let fontSize = Math.max(Math.min(origLine.fontSize, 14), 6);
      try {
        let textWidth = customFont.widthOfTextAtSize(translated, fontSize);
        while (textWidth > origLine.width + 20 && fontSize > 4) {
          fontSize -= 0.5;
          textWidth = customFont.widthOfTextAtSize(translated, fontSize);
        }
      } catch {
        // fallback ถ้า font ไม่รองรับบาง char
      }

      // 3. วาด text แปลแล้วที่ตำแหน่ง (x, y) เดิม
      try {
        pdfPage.drawText(translated, {
          x: origLine.x,
          y: origLine.y,
          size: fontSize,
          font: customFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        drawnCount++;
      } catch (err: any) {
        errorCount++;
        if (errorCount <= 3) {
          console.error(`[PDF] Page ${pageIndex}: drawText error: ${err.message}`);
        }
      }
    }

    console.log(`[PDF] Page ${pageIndex}: drawn=${drawnCount}, errors=${errorCount}`);
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
