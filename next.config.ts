import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js — used by the Docker image.
  output: "standalone",
};

export default nextConfig;
