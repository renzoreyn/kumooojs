import { ogContentType, ogSize, renderOgCard } from "@kumooo/brand/og";

export const alt = "kumooo.js blog starter";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard({
    title: "Blog starter",
    subtitle: "Posts, skins, and a small admin.",
    url: "Blog kit",
    eyebrow: "Starter",
    tag: "Blog",
  });
}
