import { ogContentType, ogSize, renderOgCard } from "@kumooo/brand/og";

export const alt = "kumooo.js shop demo";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard({
    title: "Shop starter",
    subtitle: "Catalog and cart UI for demos. No real payments. Demo data resets daily.",
    url: "shop.kumooo.site",
    eyebrow: "Live demo",
    tag: "Shop",
  });
}
