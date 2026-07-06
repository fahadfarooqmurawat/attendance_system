import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: path.join(dirname, "../.."),
  typedRoutes: true
};

export default nextConfig;
