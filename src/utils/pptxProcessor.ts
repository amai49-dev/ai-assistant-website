import JSZip from "jszip";

// ------------------- PPTX Text Extraction -------------------
// PPTX = ZIP archive ที่มี XML files
// ข้อความอยู่ใน ppt/slides/slide{N}.xml ภายใน <a:t> tags

export interface SlideTexts {
  slideIndex: number;
  slideFile: string;
  texts: string[];
}

export async function extractPptxTexts(buffer: Buffer): Promise<SlideTexts[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slides: SlideTexts[] = [];

  // หา slide files ทั้งหมด (ppt/slides/slide1.xml, slide2.xml, ...)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const xml = await zip.file(slideFile)!.async("string");
    const texts = extractTextsFromXml(xml);

    slides.push({
      slideIndex: i,
      slideFile,
      texts,
    });
  }

  return slides;
}

// ดึง text จาก <a:t> tags ใน XML
function extractTextsFromXml(xml: string): string[] {
  const texts: string[] = [];
  const regex = /<a:t>([^<]*)<\/a:t>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    if (match[1].trim()) {
      texts.push(match[1]);
    }
  }

  return texts;
}

// ------------------- PPTX Rebuild -------------------
// แทนที่ text ใน <a:t> tags ของแต่ละ slide ด้วยข้อความที่แปลแล้ว
// รักษา layout, formatting, images, shapes ทั้งหมดไว้

export async function buildTranslatedPptx(
  originalBuffer: Buffer,
  translations: Map<string, string[]>,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(originalBuffer);

  for (const [slideFile, translatedTexts] of translations) {
    const file = zip.file(slideFile);
    if (!file) continue;

    const xml = await file.async("string");
    const newXml = replaceTextsInXml(xml, translatedTexts);
    zip.file(slideFile, newXml);
  }

  const outputBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return outputBuffer;
}

// แทนที่ <a:t> tags ตามลำดับ
function replaceTextsInXml(xml: string, translatedTexts: string[]): string {
  let textIndex = 0;
  const regex = /<a:t>([^<]*)<\/a:t>/g;

  return xml.replace(regex, (fullMatch, originalText) => {
    // ข้าม text ที่ว่าง (whitespace-only) -- ไม่ได้ส่งไปแปล
    if (!originalText.trim()) {
      return fullMatch;
    }

    if (textIndex < translatedTexts.length) {
      const translated = escapeXml(translatedTexts[textIndex]);
      textIndex++;
      return `<a:t>${translated}</a:t>`;
    }

    return fullMatch;
  });
}

// Escape special XML characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
