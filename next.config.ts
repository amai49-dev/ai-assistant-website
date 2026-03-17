import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    proxyClientMaxBodySize: 50 * 1024 * 1024, // 50MB -- สำหรับ upload ไฟล์แปลเอกสาร
  },
};

export default nextConfig;
