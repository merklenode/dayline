import { createRequire } from "node:module";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

const require = createRequire(import.meta.url);

if (process.env.NODE_ENV === "development") {
  try {
    const { initOpenNextCloudflareForDev } = require(
      "@opennextjs/cloudflare",
    ) as typeof import("@opennextjs/cloudflare");

    initOpenNextCloudflareForDev();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (
      nodeError.code !== "MODULE_NOT_FOUND" ||
      !nodeError.message.includes("@opennextjs/cloudflare")
    ) {
      throw error;
    }

    console.warn(
      "Skipping OpenNext Cloudflare dev initialization because @opennextjs/cloudflare is not installed.",
    );
  }
}

export default nextConfig;
