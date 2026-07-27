import { ImageResponse } from "next/og";
import { BRAND, BrandMarkSvg } from "./mark";

export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";

export type OgCardInput = {
  title: string;
  subtitle: string;
  url: string;
  /** Small label above the title, e.g. "Live demo" */
  eyebrow?: string;
  /** Right-side footer chip */
  tag?: string;
};

/**
 * Shared Open Graph card: real brand mark, mint wash, brand-first wordmark.
 */
export function renderOgCard(input: OgCardInput) {
  const eyebrow = input.eyebrow?.trim() || null;
  const tag = input.tag?.trim() || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: BRAND.bg,
          color: BRAND.fg,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(900px 520px at 12% -10%, rgba(110,231,183,0.22), transparent 58%), radial-gradient(700px 480px at 92% 110%, rgba(110,231,183,0.10), transparent 55%), linear-gradient(155deg, #0c0c0e 0%, #121416 48%, #0e1512 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 28,
            border: `1px solid ${BRAND.line}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <BrandMarkSvg size={72} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    display: "flex",
                    alignItems: "baseline",
                  }}
                >
                  kumooo
                  <span style={{ color: BRAND.mint }}>.js</span>
                </div>
                {eyebrow ? (
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: BRAND.fog,
                    }}
                  >
                    {eyebrow}
                  </div>
                ) : null}
              </div>
            </div>
            {tag ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: `1px solid ${BRAND.line}`,
                  background: "rgba(245,245,247,0.04)",
                  color: BRAND.fog,
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                {tag}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 700,
                letterSpacing: "-0.045em",
                lineHeight: 1.05,
              }}
            >
              {input.title}
            </div>
            <div
              style={{
                fontSize: 28,
                color: BRAND.fog,
                lineHeight: 1.4,
                maxWidth: 880,
              }}
            >
              {input.subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 22,
              color: BRAND.fog,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: BRAND.mint,
                }}
              />
              <div style={{ fontWeight: 600, letterSpacing: "-0.02em", color: BRAND.fg }}>
                {input.url}
              </div>
            </div>
            <div style={{ opacity: 0.75 }}>Next.js · Cloudflare</div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
