/** Curated site fonts (Google Fonts + system + custom upload). */

export type SiteFontId =
  | "system"
  | "inter"
  | "dm-sans"
  | "space-grotesk"
  | "manrope"
  | "playfair"
  | "source-serif"
  | "jetbrains-mono"
  | "custom";

export type SiteFontDef = {
  id: SiteFontId;
  label: string;
  /** CSS font-family stack (without custom var). */
  family: string;
  /** Google Fonts family query, e.g. Inter:wght@400;600;700. Null = no link. */
  google: string | null;
};

export const SITE_FONTS: readonly SiteFontDef[] = [
  {
    id: "system",
    label: "System",
    family: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    google: null,
  },
  {
    id: "inter",
    label: "Inter",
    family: "Inter, ui-sans-serif, system-ui, sans-serif",
    google: "Inter:wght@400;500;600;700",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    family: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    google: "DM+Sans:wght@400;500;600;700",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    google: "Space+Grotesk:wght@400;500;600;700",
  },
  {
    id: "manrope",
    label: "Manrope",
    family: "Manrope, ui-sans-serif, system-ui, sans-serif",
    google: "Manrope:wght@400;500;600;700",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    family: "'Playfair Display', ui-serif, Georgia, serif",
    google: "Playfair+Display:wght@400;500;600;700",
  },
  {
    id: "source-serif",
    label: "Source Serif 4",
    family: "'Source Serif 4', ui-serif, Georgia, serif",
    google: "Source+Serif+4:wght@400;500;600;700",
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    family: "'JetBrains Mono', ui-monospace, monospace",
    google: "JetBrains+Mono:wght@400;500;600;700",
  },
  {
    id: "custom",
    label: "Custom upload",
    family: "var(--font-custom), ui-sans-serif, system-ui, sans-serif",
    google: null,
  },
] as const;

export function isSiteFontId(value: unknown): value is SiteFontId {
  return typeof value === "string" && SITE_FONTS.some((f) => f.id === value);
}

export function siteFontById(id: string | null | undefined): SiteFontDef {
  return SITE_FONTS.find((f) => f.id === id) || SITE_FONTS[0]!;
}

export function googleFontsHref(fontId: string | null | undefined): string | null {
  const font = siteFontById(fontId);
  if (!font.google) return null;
  return `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
}

export function siteFontFamilyCss(
  fontId: string | null | undefined,
  customUrl?: string | null,
): string {
  const font = siteFontById(fontId);
  if (font.id === "custom" && customUrl) {
    return "var(--font-custom), ui-sans-serif, system-ui, sans-serif";
  }
  if (font.id === "custom") {
    return SITE_FONTS[0]!.family;
  }
  return font.family;
}
