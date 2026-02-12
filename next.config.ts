import path from "path";
import fs from "fs";
import type { NextConfig } from "next";

const cwd = process.cwd();
const withModelyo = path.join(cwd, "modelyo");
const projectRoot = fs.existsSync(
  path.join(withModelyo, "node_modules", "tailwindcss", "package.json")
)
  ? withModelyo
  : cwd;

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  webpack: (config) => {
    config.context = projectRoot;
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force tailwindcss to resolve in this project (avoids wrong context from /Users/.../Sites).
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    };
    return config;
  },
};

export default nextConfig;
