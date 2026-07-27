import { z } from "zod";

export const siteMetaSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  url: z.string().url().optional(),
});

export type SiteMeta = z.infer<typeof siteMetaSchema>;

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export function parseSiteMeta(input: unknown): SiteMeta {
  return siteMetaSchema.parse(input);
}

export const KUMOOO_STARTERS = ["blank", "blog", "shop"] as const;
export type KumoooStarter = (typeof KUMOOO_STARTERS)[number];
