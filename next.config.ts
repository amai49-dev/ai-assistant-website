import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // บล็อก Turbopack ไม่ให้ resolve pdfjs-dist (มาจาก unpdf type definitions)
      // เราใช้ unpdf ซึ่ง bundle serverless PDF.js ของตัวเอง ไม่ต้องการ pdfjs-dist
      "pdfjs-dist": "",
      "pdfjs-dist/legacy/build/pdf.mjs": "",
    },
  },
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024, // 50MB -- สำหรับ upload ไฟล์แปลเอกสาร
  },
};

export default nextConfig;
