import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@kumooo/ui", "@kumooo/theme-packs", "@kumooo/brand"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
