import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.56.1:3000",
    "http://192.168.100.29:3000",
    "http://192.168.137.182:3000",
    "http://localhost:3000"
  ],

  reactStrictMode: true,

};

export default nextConfig;
