import { ogContentType, ogSize, renderOgCard } from "@kumooo/brand/og";

export const alt = "kumooo.js shop starter";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard({
    title: "Shop starter",
    subtitle: "Catalog and cart UI for demos. No real payments.",
    url: "Shop kit",
    eyebrow: "Starter",
    tag: "Shop",
  });
}
