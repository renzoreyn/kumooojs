export const SKINS = ["y2k", "kumooo", "glass"] as const;

export type SkinId = (typeof SKINS)[number];

export const SKIN_LABELS: Record<SkinId, string> = {
  y2k: "Y2K",
  kumooo: "kumooo",
  glass: "Glass",
};

/** Accent used in brand mark + favicon per skin */
export const SKIN_ACCENTS: Record<SkinId, string> = {
  y2k: "#ff2bd6",
  kumooo: "#0d9488",
  glass: "#0071e3",
};

export const DEFAULT_SKIN: SkinId = "y2k";

export const SKIN_STORAGE_KEY = "kumooo-skin";
export const COLOR_MODE_STORAGE_KEY = "kumooo-color-mode";

export function isSkinId(value: string | null | undefined): value is SkinId {
  return value === "y2k" || value === "kumooo" || value === "glass";
}

/** SVG data-URL favicon - white k, skin-colored dot */
export function faviconDataUrl(skin: SkinId): string {
  const accent = SKIN_ACCENTS[skin];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#ffffff" transform="translate(6.811 3.2) scale(0.071508)"><rect width="85" height="358"/><polygon points="85,252 133,185 134,185 147,204 161,223 174,242 187,261 201,280 214,299 228,318 241,337 255,356 256,357 156,357 155,356 142,337 129,318 116,299 103,280 90,261 90,252"/><circle cx="191.65" cy="155.3" r="42" fill="${accent}"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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

export type ThemeBootOptions = {
  /**
   * When true (default), honor localStorage skin (demo switcher).
   * When false, force `defaultSkin` (dashboard-locked sites).
   */
  preferStored?: boolean;
};

/** Inline script for <head> - applies skin + color mode + favicon before paint. */
export function themeBootScript(
  defaultSkin: SkinId = DEFAULT_SKIN,
  opts: ThemeBootOptions = {},
): string {
  const preferStored = opts.preferStored !== false;
  const accents = JSON.stringify(SKIN_ACCENTS);
  const skinExpr = preferStored
    ? `var s=localStorage.getItem('${SKIN_STORAGE_KEY}');var skin=${JSON.stringify(SKINS)}.indexOf(s)>=0?s:${JSON.stringify(defaultSkin)};`
    : `var skin=${JSON.stringify(defaultSkin)};`;
  return `(function(){try{var accents=${accents};${skinExpr}document.documentElement.setAttribute('data-skin',skin);var m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);var accent=accents[skin]||accents.y2k;var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#ffffff" transform="translate(6.811 3.2) scale(0.071508)"><rect width="85" height="358"/><polygon points="85,252 133,185 134,185 147,204 161,223 174,242 187,261 201,280 214,299 228,318 241,337 255,356 256,357 156,357 155,356 142,337 129,318 116,299 103,280 90,261 90,252"/><circle cx="191.65" cy="155.3" r="42" fill="'+accent+'"/></g></svg>';var href='data:image/svg+xml,'+encodeURIComponent(svg);var link=document.querySelector('link[rel="icon"]');if(!link){link=document.createElement('link');link.rel='icon';link.type='image/svg+xml';document.head.appendChild(link);}link.type='image/svg+xml';link.href=href;}catch(e){document.documentElement.setAttribute('data-skin',${JSON.stringify(defaultSkin)});}})();`;
}
