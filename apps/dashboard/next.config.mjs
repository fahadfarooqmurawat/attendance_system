/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@attendance/db", "@attendance/shared", "@attendance/attendance-core"],
};

export default nextConfig;
