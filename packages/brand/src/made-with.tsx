import type { CSSProperties, ReactNode } from "react";
import { BRAND } from "./mark";

const markSvg = (
  <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden fill="currentColor">
    <g transform="translate(6.811 3.2) scale(0.071508)">
      <rect x="0" y="0" width="85" height="358" />
      <polygon points="85,252 133,185 134,185 147,204 161,223 174,242 187,261 201,280 214,299 228,318 241,337 255,356 256,357 156,357 155,356 142,337 129,318 116,299 103,280 90,261 90,252" />
      <circle cx="191.65" cy="155.3" r="42" fill={BRAND.mint} />
    </g>
  </svg>
);

export type MadeWithKumoooProps = {
  href?: string;
  /** Default: "made with kumooo.js" */
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Credit pill for starters and demos. Lives in document flow (usually under the page).
 * Not fixed: a floating overlay covers footers and links.
 * Inline styles so it works without shared Tailwind tokens.
 */
export function MadeWithKumooo({
  href = "https://kumooo.dev",
  label,
  className,
  style,
}: MadeWithKumoooProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Made with kumooo.js"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        margin: "1.25rem 1.25rem 1.5rem",
        padding: "10px 14px 10px 11px",
        borderRadius: 999,
        background: "rgba(18, 18, 20, 0.9)",
        border: `1px solid ${BRAND.line}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        color: BRAND.fg,
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          width: 22,
          height: 22,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "#0c0c0e",
          border: `1px solid ${BRAND.line}`,
          color: BRAND.fg,
          flexShrink: 0,
        }}
      >
        {markSvg}
      </span>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0 }}>
        {label ?? (
          <>
            made with{" "}
            <span style={{ color: BRAND.mint, marginLeft: 4 }}>kumooo.js</span>
          </>
        )}
      </span>
    </a>
  );
}
