import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is an unrelated `package-lock.json` in the parent directory (/home/gamp),
  // which makes Next.js infer a workspace root one level too high. That breaks
  // module resolution (e.g. `tailwindcss` is looked up outside this project), so
  // pin the root to this directory explicitly.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
