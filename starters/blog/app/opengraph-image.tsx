import { ogContentType, ogSize, renderOgCard } from "@kumooo/brand/og";

export const alt = "kumooo.js blog demo";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard({
    title: "Blog starter",
    subtitle: "Posts, skins, and a small admin. Demo data resets daily.",
    url: "blog.kumooo.site",
    eyebrow: "Live demo",
    tag: "Blog",
  });
}
