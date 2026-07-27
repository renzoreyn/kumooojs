import type { ReactElement } from "react";

/** Brand-mark PNG (128×128) as data URI for emails / HTML. Prefer {@link BrandMarkSvg} in next/og. */
export const BRAND_MARK_DATA_URI =
  "data:image/png;base64,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";

export const BRAND = {
  name: "kumooo.js",
  mint: "#6ee7b7",
  fg: "#f5f5f7",
  fog: "#a1a1a6",
  line: "rgba(245,245,247,0.12)",
  bg: "#0c0c0e",
} as const;

/**
 * Geometric k on a black plate. Drawn as SVG so next/og (Satori) actually paints it.
 */
export function BrandMarkSvg({ size = 72 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{
        borderRadius: Math.round(size * 0.22),
        border: `1px solid ${BRAND.line}`,
      }}
    >
      <rect width="32" height="32" fill="#0c0c0e" rx="7" />
      <g transform="translate(6.811 3.2) scale(0.071508)" fill={BRAND.fg}>
        <rect x="0" y="0" width="85" height="358" />
        <polygon points="85,252 133,185 134,185 147,204 161,223 174,242 187,261 201,280 214,299 228,318 241,337 255,356 256,357 156,357 155,356 142,337 129,318 116,299 103,280 90,261 90,252" />
        <circle cx="191.65" cy="155.3" r="42" fill={BRAND.mint} />
      </g>
    </svg>
  );
}
