import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root so a stray lockfile in $HOME doesn't
  // confuse Next.js into picking the wrong root.
  turbopack: { root },
};

export default nextConfig;
