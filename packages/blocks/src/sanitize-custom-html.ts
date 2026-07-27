import sanitizeHtml from "sanitize-html";
import type { Block, PageDocument } from "./types";
import { mapBlocks } from "./types";

export const CUSTOM_HTML_MAX_CHARS = 100_000;

const ALLOWED_TAGS = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "section",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "u",
  "ul",
  "var",
  "wbr",
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "name", "target", "rel", "title"],
  img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
  source: ["src", "srcset", "type", "media", "sizes"],
  col: ["span"],
  colgroup: ["span"],
  td: ["colspan", "rowspan", "headers"],
  th: ["colspan", "rowspan", "headers", "scope"],
  time: ["datetime"],
  details: ["open"],
  "*": ["class", "id", "title", "lang", "dir", "role", "aria-*", "data-*", "style"],
};

const DANGEROUS_CSS =
  /expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding\b|behavior\s*:|url\s*\(\s*['"]?\s*javascript:/i;

/** Drop individual `property: value` declarations that contain dangerous CSS. */
function scrubDeclarations(css: string): string {
  return css
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !DANGEROUS_CSS.test(part))
    .join("; ");
}

/** Scrub a full stylesheet: remove @import, then scrub each rule body. */
function scrubStyleSheet(css: string): string {
  let out = css.replace(/@import[\s\S]*?(;|$)/gi, "");
  out = out.replace(/\{([^}]*)\}/g, (_m, body: string) => {
    const cleaned = scrubDeclarations(body);
    return `{${cleaned}}`;
  });
  // Collapse empty rules left behind
  out = out.replace(/[^{};]+\{\s*\}/g, "");
  return out.trim();
}

function scrubStyleTags(html: string): string {
  return html.replace(/<style(\b[^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs: string, body: string) => {
    const cleaned = scrubStyleSheet(body);
    return cleaned ? `<style${attrs}>${cleaned}</style>` : "";
  });
}

function scrubInlineStyles(html: string): string {
  return html.replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (_m, quote: string, css: string) => {
    const cleaned = scrubDeclarations(css);
    return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
  });
}

/**
 * Allowlisted HTML/CSS for the `html` block. Strips scripts, iframes, forms,
 * event handlers, and dangerous URLs. Applied on save and again at render.
 */
export function sanitizeCustomHtml(raw: string): string {
  const input = String(raw ?? "").slice(0, CUSTOM_HTML_MAX_CHARS);
  const cleaned = sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      source: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    // We allow <style> then scrub CSS ourselves (see scrubCss).
    allowVulnerableTags: true,
    // Keep style attribute values; we scrub CSS after.
    allowedStyles: {
      "*": {
        color: [/.*/],
        "background-color": [/.*/],
        background: [/.*/],
        "background-image": [/^url\(/i],
        border: [/.*/],
        "border-radius": [/.*/],
        "border-color": [/.*/],
        "border-width": [/.*/],
        "border-style": [/.*/],
        margin: [/.*/],
        "margin-top": [/.*/],
        "margin-right": [/.*/],
        "margin-bottom": [/.*/],
        "margin-left": [/.*/],
        padding: [/.*/],
        "padding-top": [/.*/],
        "padding-right": [/.*/],
        "padding-bottom": [/.*/],
        "padding-left": [/.*/],
        width: [/.*/],
        "max-width": [/.*/],
        "min-width": [/.*/],
        height: [/.*/],
        "max-height": [/.*/],
        "min-height": [/.*/],
        display: [/.*/],
        flex: [/.*/],
        "flex-direction": [/.*/],
        "flex-wrap": [/.*/],
        "align-items": [/.*/],
        "justify-content": [/.*/],
        gap: [/.*/],
        "grid-template-columns": [/.*/],
        "grid-template-rows": [/.*/],
        "font-size": [/.*/],
        "font-weight": [/.*/],
        "font-family": [/.*/],
        "font-style": [/.*/],
        "line-height": [/.*/],
        "letter-spacing": [/.*/],
        "text-align": [/.*/],
        "text-decoration": [/.*/],
        "text-transform": [/.*/],
        "white-space": [/.*/],
        opacity: [/.*/],
        overflow: [/.*/],
        "overflow-x": [/.*/],
        "overflow-y": [/.*/],
        position: [/.*/],
        top: [/.*/],
        right: [/.*/],
        bottom: [/.*/],
        left: [/.*/],
        "z-index": [/.*/],
        "box-shadow": [/.*/],
        "object-fit": [/.*/],
        "aspect-ratio": [/.*/],
        transform: [/.*/],
        transition: [/.*/],
        "list-style": [/.*/],
        "vertical-align": [/.*/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
  return scrubInlineStyles(scrubStyleTags(cleaned)).trim();
}

export function documentHasCustomHtml(doc: PageDocument): boolean {
  return blocksHaveCustomHtml(doc.blocks);
}

function blocksHaveCustomHtml(blocks: Block[]): boolean {
  for (const b of blocks) {
    if (b.type === "html") return true;
    if (b.type === "section" && blocksHaveCustomHtml(b.blocks)) return true;
    if (b.type === "columns") {
      if (blocksHaveCustomHtml(b.columns[0]) || blocksHaveCustomHtml(b.columns[1])) return true;
    }
  }
  return false;
}

/** Sanitize every `html` block in a document tree. */
export function sanitizeDocumentCustomHtml(doc: PageDocument): PageDocument {
  return {
    ...doc,
    blocks: mapBlocks(doc.blocks, (b) => {
      if (b.type !== "html") return b;
      return { ...b, html: sanitizeCustomHtml(b.html) };
    }),
  };
}
