import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.MEASUREMENT_DATABASE_ONLY === "true" ? ".next-measurements" : ".next",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
