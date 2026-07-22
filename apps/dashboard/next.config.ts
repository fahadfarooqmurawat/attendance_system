import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(dirname, "../.."),
  transpilePackages: ["@attendance/db", "@attendance/shared", "@attendance/attendance-core"],
  typedRoutes: true
};

export default nextConfig;
