import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@kumooo/ui", "@kumooo/brand"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
