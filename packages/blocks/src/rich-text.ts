/**
 * Constrained inline HTML for block text fields.
 * Allowed: strong/b, em/i, u, br, a[href], span[style: color|font-size]
 */

const MAX_DEFAULT = 20000;

const VOID_TAGS = new Set(["br"]);
const INLINE_TAGS = new Set(["strong", "b", "em", "i", "u", "a", "span", "br", "font"]);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unescapeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("/")) return href.slice(0, 500);
  try {
    const u = new URL(href);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") {
      return u.toString().slice(0, 500);
    }
  } catch {
    return null;
  }
  return null;
}

function safeColor(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgb) {
    const channels = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    if (channels.every((n) => n >= 0 && n <= 255)) {
      return `#${channels.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  if (/^var\(--[a-z0-9-]+\)$/.test(v)) return v;
  return null;
}

function safeFontSize(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(v)) return v.slice(0, 16);
  return null;
}

function sanitizeStyle(raw: string): string {
  const parts: string[] = [];
  for (const decl of raw.split(";")) {
    const [propRaw, ...rest] = decl.split(":");
    if (!propRaw || !rest.length) continue;
    const prop = propRaw.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (prop === "color") {
      const c = safeColor(value);
      if (c) parts.push(`color:${c}`);
    } else if (prop === "font-size") {
      const s = safeFontSize(value);
      if (s) parts.push(`font-size:${s}`);
    }
  }
  return parts.join(";");
}

function normalizeTag(name: string): string {
  const t = name.toLowerCase();
  if (t === "b") return "strong";
  if (t === "i") return "em";
  return t;
}

/** True when the string contains (or should keep) inline markup. */
export function isRichText(value: string): boolean {
  return /<\s*\/?\s*[a-z]/i.test(String(value ?? ""));
}

/** Strip tags to plain text (newlines from br). */
export function richTextToPlain(html: string): string {
  return unescapeEntities(
    String(html ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

/**
 * Sanitize user/editor HTML into a safe inline fragment.
 * Plain text (no tags) is returned unchanged (newlines kept).
 */
export function sanitizeRichText(input: string, maxLen = MAX_DEFAULT): string {
  const raw = String(input ?? "");
  if (!isRichText(raw)) {
    return raw.replace(/\u00a0/g, " ").slice(0, maxLen);
  }

  let out = "";
  let i = 0;
  const s = raw;
  const openStack: string[] = [];

  while (i < s.length && out.length < maxLen * 2) {
    if (s[i] !== "<") {
      const next = s.indexOf("<", i);
      const chunk = next < 0 ? s.slice(i) : s.slice(i, next);
      out += escapeHtml(unescapeEntities(chunk).replace(/\u00a0/g, " "));
      i = next < 0 ? s.length : next;
      continue;
    }

    const end = s.indexOf(">", i);
    if (end < 0) break;
    const rawTag = s.slice(i + 1, end).trim();
    i = end + 1;

    const isClose = rawTag.startsWith("/");
    const isSelf = rawTag.endsWith("/") || /^br\b/i.test(rawTag);
    const body = isClose ? rawTag.slice(1).trim() : rawTag.replace(/\/\s*$/, "").trim();
    const nameMatch = body.match(/^([a-zA-Z0-9]+)/);
    if (!nameMatch) continue;
    const tag = normalizeTag(nameMatch[1]!);
    if (!INLINE_TAGS.has(tag) && tag !== "b" && tag !== "i") continue;

    if (isClose) {
      let closeTag = tag;
      if (closeTag === "font") closeTag = "span";
      if (closeTag === "b") closeTag = "strong";
      if (closeTag === "i") closeTag = "em";
      const idx = openStack.lastIndexOf(closeTag);
      if (idx >= 0) {
        while (openStack.length > idx) {
          const t = openStack.pop()!;
          out += `</${t}>`;
        }
      }
      continue;
    }

    if (VOID_TAGS.has(tag) || isSelf && tag === "br") {
      out += "<br/>";
      continue;
    }

    if (tag === "a") {
      const hrefMatch = body.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = safeHref(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || "");
      if (!href) continue;
      out += `<a href="${escapeHtml(href)}">`;
      openStack.push("a");
      continue;
    }

    if (tag === "span") {
      const styleMatch = body.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const style = sanitizeStyle(styleMatch?.[1] || styleMatch?.[2] || styleMatch?.[3] || "");
      if (!style) continue;
      out += `<span style="${escapeHtml(style)}">`;
      openStack.push("span");
      continue;
    }

    if (tag === "font") {
      const colorMatch = body.match(/\bcolor\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const color = safeColor(colorMatch?.[1] || colorMatch?.[2] || colorMatch?.[3] || "");
      if (!color) continue;
      out += `<span style="color:${escapeHtml(color)}">`;
      openStack.push("span");
      continue;
    }

    if (tag === "strong" || tag === "em" || tag === "u") {
      out += `<${tag}>`;
      openStack.push(tag);
    }
  }

  while (openStack.length) {
    out += `</${openStack.pop()}>`;
  }

  // Prefer plain storage when markup adds nothing
  const plain = richTextToPlain(out);
  if (!isRichText(out) || plain.length > maxLen) {
    return plain.slice(0, maxLen);
  }
  if (out.length > maxLen * 3) return plain.slice(0, maxLen);
  return out;
}

/** HTML for live/public render (safe). */
export function renderRichText(raw: string): string {
  const sanitized = sanitizeRichText(raw);
  if (!isRichText(sanitized)) {
    return escapeHtml(sanitized).replace(/\n/g, "<br/>");
  }
  return sanitized;
}

/** HTML for contentEditable seed. */
export function richTextToEditorHtml(raw: string): string {
  return renderRichText(raw);
}

/** After editor blur: normalize to storage form. */
export function richTextFromEditorHtml(html: string, maxLen = MAX_DEFAULT): string {
  const sanitized = sanitizeRichText(html, maxLen);
  if (!isRichText(sanitized)) return richTextToPlain(sanitized).slice(0, maxLen);
  // Collapse empty wrappers
  const plain = richTextToPlain(sanitized);
  if (!plain.trim()) return "";
  return sanitized;
}
