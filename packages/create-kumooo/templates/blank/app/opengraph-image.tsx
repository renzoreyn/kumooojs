import { ogContentType, ogSize, renderOgCard } from "@kumooo/brand/og";

export const alt = "kumooo.js blank starter";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard({
    title: "Blank starter",
    subtitle: "Minimal Next.js starter with @kumooo/ui. Light and dark themes.",
    url: "Blank kit",
    eyebrow: "Starter",
    tag: "Blank",
  });
}
