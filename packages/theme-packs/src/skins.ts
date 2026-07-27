export {
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_SKIN,
  SKIN_ACCENTS,
  SKIN_LABELS,
  SKIN_STORAGE_KEY,
  SKINS,
  SKINS_CSS,
  faviconDataUrl,
  isSkinId,
  themeBootScript,
  type SkinId,
  type ThemeBootOptions,
} from "./skins-core";

import {
  SKIN_STORAGE_KEY,
  faviconDataUrl,
  type SkinId,
} from "./skins-core";

/** Swap (or create) the document favicon for the active skin. */
export function applySkinFavicon(skin: SkinId): void {
  if (typeof document === "undefined") return;
  const href = faviconDataUrl(skin);
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
}

/** Apply skin on <html> + favicon (and optionally persist). */
export function applySkin(skin: SkinId, opts?: { persist?: boolean }): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-skin", skin);
  applySkinFavicon(skin);
  if (opts?.persist) {
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {
      /* ignore */
    }
  }
}
