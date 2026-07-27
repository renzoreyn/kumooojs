import {
  BLOCK_TYPES,
  countBlocks,
  defaultFormFields,
  defaultSocialItems,
  newFieldId,
  type Block,
  type BlockType,
  type FormField,
  type FormFieldKind,
  type PageDocument,
  type SocialLinkItem,
  type TextSize,
  emptyDocument,
} from "./types";
import { sanitizeRichText } from "./rich-text";
import { CUSTOM_HTML_MAX_CHARS, sanitizeCustomHtml } from "./sanitize-custom-html";

export type ParseDocumentResult =
  | { ok: true; document: PageDocument }
  | { ok: false; error: string };

const MAX_BLOCKS = 200;
const MAX_DEPTH = 4;

function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && (BLOCK_TYPES as readonly string[]).includes(value);
}

function asString(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function asRichText(value: unknown, max: number): string {
  return sanitizeRichText(String(value ?? ""), max);
}

function asAlign(value: unknown): "left" | "center" | "right" | undefined {
  if (value === "center" || value === "right" || value === "left") return value;
  return undefined;
}

function asSize(value: unknown): TextSize | undefined {
  if (value === "sm" || value === "md" || value === "lg") return value;
  return undefined;
}

function parseBlockList(raw: unknown, depth: number): Block[] | null {
  if (!Array.isArray(raw)) return null;
  const blocks: Block[] = [];
  for (const item of raw) {
    const b = parseBlock(item, depth);
    if (!b) return null;
    blocks.push(b);
  }
  return blocks;
}

function parseBlock(raw: unknown, depth: number): Block | null {
  if (!raw || typeof raw !== "object") return null;
  if (depth > MAX_DEPTH) return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id, 80) || `blk_${Math.random().toString(36).slice(2, 10)}`;
  if (!isBlockType(o.type)) return null;

  switch (o.type) {
    case "heading": {
      const level = o.level === 1 || o.level === 3 ? o.level : 2;
      return {
        id,
        type: "heading",
        level,
        text: asRichText(o.text, 2000),
        align: asAlign(o.align),
        size: asSize(o.size),
      };
    }
    case "paragraph":
      return {
        id,
        type: "paragraph",
        text: asRichText(o.text, 20000),
        align: asAlign(o.align),
        size: asSize(o.size),
      };
    case "image": {
      const width =
        o.width === "wide" || o.width === "full" || o.width === "content" ? o.width : undefined;
      const radius =
        o.radius === "none" || o.radius === "md" || o.radius === "lg" ? o.radius : undefined;
      return {
        id,
        type: "image",
        mediaKey: o.mediaKey != null ? asString(o.mediaKey, 500) || undefined : undefined,
        src: o.src != null ? asString(o.src, 2000) || undefined : undefined,
        alt: o.alt != null ? asString(o.alt, 300) : "",
        caption: o.caption != null ? asString(o.caption, 500) : undefined,
        width,
        radius,
      };
    }
    case "button": {
      const variant =
        o.variant === "outline" || o.variant === "ghost" || o.variant === "solid"
          ? o.variant
          : undefined;
      return {
        id,
        type: "button",
        label: asRichText(o.label, 400) || "Button",
        href: asString(o.href, 2000) || "#",
        align: asAlign(o.align),
        variant,
      };
    }
    case "quote":
      return {
        id,
        type: "quote",
        text: asRichText(o.text, 8000),
        cite: o.cite != null ? asRichText(o.cite, 400) : "",
        align: asAlign(o.align),
      };
    case "list": {
      const style = o.style === "ol" ? "ol" : "ul";
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems.slice(0, 40).map((item) => asRichText(item, 1000));
      return { id, type: "list", style, items: items.length ? items : [""] };
    }
    case "link":
      return {
        id,
        type: "link",
        label: asRichText(o.label, 400) || "Link",
        href: asString(o.href, 2000) || "/",
      };
    case "nav-links": {
      const maxRaw = typeof o.max === "number" ? o.max : Number(o.max);
      const max =
        Number.isFinite(maxRaw) && maxRaw > 0 ? Math.min(20, Math.floor(maxRaw)) : 6;
      return { id, type: "nav-links", max };
    }
    case "divider":
      return { id, type: "divider" };
    case "spacer": {
      const size = o.size === "sm" || o.size === "lg" ? o.size : "md";
      return { id, type: "spacer", size };
    }
    case "section": {
      const inner = parseBlockList(o.blocks, depth + 1);
      if (!inner) return null;
      const pad = o.pad === "sm" || o.pad === "lg" ? o.pad : "md";
      const width =
        o.width === "wide" || o.width === "full" ? o.width : "content";
      const background =
        o.background === "muted" || o.background === "accent-soft"
          ? o.background
          : "none";
      return { id, type: "section", pad, width, background, blocks: inner };
    }
    case "columns": {
      const cols = Array.isArray(o.columns) ? o.columns : [];
      const left = parseBlockList(cols[0], depth + 1);
      const right = parseBlockList(cols[1], depth + 1);
      if (!left || !right) return null;
      const gap = o.gap === "sm" || o.gap === "lg" ? o.gap : "md";
      const ratio =
        o.ratio === "1-2" || o.ratio === "2-1" ? o.ratio : "1-1";
      return { id, type: "columns", gap, ratio, columns: [left, right] };
    }
    case "form": {
      const fields = parseFormFields(o.fields);
      return {
        id,
        type: "form",
        title: o.title != null ? asString(o.title, 120) : "",
        submitLabel: asString(o.submitLabel, 80) || "Send",
        successMessage: asString(o.successMessage, 300) || "Got it. We will read this.",
        fields,
      };
    }
    case "badge": {
      const tone =
        o.tone === "muted" || o.tone === "fg" || o.tone === "accent" ? o.tone : "accent";
      return { id, type: "badge", text: asRichText(o.text, 200) || "Badge", tone };
    }
    case "callout": {
      const tone =
        o.tone === "accent" || o.tone === "warn" || o.tone === "muted" ? o.tone : "muted";
      return { id, type: "callout", text: asRichText(o.text, 4000), tone };
    }
    case "video":
      return {
        id,
        type: "video",
        url: asString(o.url, 2000),
        title: o.title != null ? asString(o.title, 200) : "",
      };
    case "embed": {
      const aspect =
        o.aspect === "4-3" || o.aspect === "1-1" || o.aspect === "16-9" ? o.aspect : "16-9";
      return { id, type: "embed", url: asString(o.url, 2000), aspect };
    }
    case "feature":
      return {
        id,
        type: "feature",
        title: asRichText(o.title, 600) || "Feature",
        body: asRichText(o.body, 4000),
        align: asAlign(o.align),
      };
    case "social-links":
      return { id, type: "social-links", items: parseSocialItems(o.items) };
    case "hero": {
      const background =
        o.background === "muted" || o.background === "accent-soft" || o.background === "none"
          ? o.background
          : "none";
      return {
        id,
        type: "hero",
        heading: asString(o.heading, 500) || "Welcome",
        subtext: o.subtext != null ? asString(o.subtext, 2000) : "",
        buttonLabel: o.buttonLabel != null ? asString(o.buttonLabel, 120) || undefined : undefined,
        buttonHref: o.buttonHref != null ? asString(o.buttonHref, 2000) || undefined : undefined,
        align: asAlign(o.align) || "center",
        background,
      };
    }
    case "stats": {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems.slice(0, 6).map((item) => {
        if (!item || typeof item !== "object") return { value: "0", label: "Stat" };
        const it = item as Record<string, unknown>;
        return {
          value: asString(it.value, 40) || "0",
          label: asString(it.label, 80) || "Stat",
        };
      });
      return {
        id,
        type: "stats",
        items: items.length ? items : [{ value: "0", label: "Stat" }],
        align: asAlign(o.align) || "center",
      };
    }
    case "gallery": {
      const colsRaw = typeof o.columns === "number" ? o.columns : Number(o.columns);
      const columns = colsRaw === 2 || colsRaw === 4 ? colsRaw : 3;
      const radius =
        o.radius === "none" || o.radius === "md" || o.radius === "lg" ? o.radius : "md";
      const rawImages = Array.isArray(o.images) ? o.images : [];
      const images = rawImages.slice(0, 20).map((img) => {
        if (!img || typeof img !== "object") return { src: "", alt: "" };
        const it = img as Record<string, unknown>;
        return {
          mediaKey: it.mediaKey != null ? asString(it.mediaKey, 500) || undefined : undefined,
          src: it.src != null ? asString(it.src, 2000) || undefined : undefined,
          alt: it.alt != null ? asString(it.alt, 300) : "",
        };
      });
      return {
        id,
        type: "gallery",
        images: images.length ? images : [{ src: "", alt: "" }],
        columns,
        radius,
      };
    }
    case "logo-strip": {
      const rawLogos = Array.isArray(o.logos) ? o.logos : [];
      const logos = rawLogos.slice(0, 12).map((logo) => {
        if (!logo || typeof logo !== "object") return { src: "", alt: "" };
        const it = logo as Record<string, unknown>;
        return {
          mediaKey: it.mediaKey != null ? asString(it.mediaKey, 500) || undefined : undefined,
          src: it.src != null ? asString(it.src, 2000) || undefined : undefined,
          alt: it.alt != null ? asString(it.alt, 120) : "",
        };
      });
      return {
        id,
        type: "logo-strip",
        logos: logos.length ? logos : [{ src: "", alt: "" }],
        label: o.label != null ? asString(o.label, 120) || undefined : undefined,
      };
    }
    case "faq": {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems.slice(0, 30).map((item) => {
        if (!item || typeof item !== "object") return { question: "Question", answer: "Answer" };
        const it = item as Record<string, unknown>;
        return {
          question: asString(it.question, 500) || "Question",
          answer: asString(it.answer, 4000) || "Answer",
        };
      });
      return {
        id,
        type: "faq",
        items: items.length ? items : [{ question: "Question", answer: "Answer" }],
      };
    }
    case "steps": {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems.slice(0, 20).map((item) => {
        if (!item || typeof item !== "object") return { title: "Step", body: "Description" };
        const it = item as Record<string, unknown>;
        return {
          title: asString(it.title, 200) || "Step",
          body: asString(it.body, 2000) || "Description",
        };
      });
      return {
        id,
        type: "steps",
        items: items.length ? items : [{ title: "Step", body: "Description" }],
      };
    }
    case "pricing-card": {
      const rawFeatures = Array.isArray(o.features) ? o.features : [];
      const features = rawFeatures.slice(0, 20).map((f) => asString(f, 200));
      return {
        id,
        type: "pricing-card",
        name: asString(o.name, 80) || "Plan",
        price: asString(o.price, 40) || "$0",
        period: o.period != null ? asString(o.period, 40) || undefined : undefined,
        description: o.description != null ? asString(o.description, 400) || undefined : undefined,
        features: features.length ? features : ["Feature"],
        buttonLabel: o.buttonLabel != null ? asString(o.buttonLabel, 120) || undefined : undefined,
        buttonHref: o.buttonHref != null ? asString(o.buttonHref, 2000) || undefined : undefined,
        highlighted: Boolean(o.highlighted),
      };
    }
    case "testimonial":
      return {
        id,
        type: "testimonial",
        quote: asString(o.quote, 4000) || "",
        name: asString(o.name, 120) || "Name",
        role: o.role != null ? asString(o.role, 120) || undefined : undefined,
        avatarSrc: o.avatarSrc != null ? asString(o.avatarSrc, 2000) || undefined : undefined,
        avatarMediaKey:
          o.avatarMediaKey != null ? asString(o.avatarMediaKey, 500) || undefined : undefined,
      };
    case "alert-banner": {
      const tone =
        o.tone === "warn" || o.tone === "success" || o.tone === "info" ? o.tone : "info";
      return {
        id,
        type: "alert-banner",
        text: asString(o.text, 1000) || "",
        tone,
        dismissible: Boolean(o.dismissible),
      };
    }
    case "breadcrumb": {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const items = rawItems.slice(0, 10).map((item) => {
        if (!item || typeof item !== "object") return { label: "Page" };
        const it = item as Record<string, unknown>;
        const href = it.href != null ? asString(it.href, 2000) : "";
        return {
          label: asString(it.label, 80) || "Page",
          href: href || undefined,
        };
      });
      return {
        id,
        type: "breadcrumb",
        items: items.length ? items : [{ label: "Home", href: "/" }],
      };
    }
    case "html":
      return {
        id,
        type: "html",
        html: sanitizeCustomHtml(asString(o.html, CUSTOM_HTML_MAX_CHARS)),
      };
  }
}

function asFieldKind(value: unknown): FormFieldKind {
  if (value === "email" || value === "textarea" || value === "tel" || value === "select") {
    return value;
  }
  return "text";
}

function fieldNameFromLabel(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return base || "field";
}

function parseFormFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultFormFields();
  const fields: FormField[] = [];
  const used = new Set<string>();
  for (const item of raw.slice(0, 20)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = asString(o.label, 80) || "Field";
    let name = asString(o.name, 40).replace(/[^a-zA-Z0-9_]/g, "") || fieldNameFromLabel(label);
    name = name.slice(0, 40) || "field";
    let unique = name;
    let n = 2;
    while (used.has(unique)) {
      unique = `${name}_${n}`.slice(0, 40);
      n += 1;
    }
    used.add(unique);
    const kind = asFieldKind(o.kind);
    const options = Array.isArray(o.options)
      ? o.options.slice(0, 30).map((opt) => asString(opt, 120)).filter(Boolean)
      : undefined;
    fields.push({
      id: asString(o.id, 80) || newFieldId(),
      name: unique,
      label,
      kind,
      required: Boolean(o.required),
      options: kind === "select" ? (options?.length ? options : ["Option A", "Option B"]) : undefined,
    });
  }
  return fields.length ? fields : defaultFormFields();
}

function parseSocialItems(raw: unknown): SocialLinkItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSocialItems();
  const items: SocialLinkItem[] = [];
  for (const item of raw.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    items.push({
      label: asString(o.label, 40) || "Link",
      href: asString(o.href, 2000) || "#",
    });
  }
  return items.length ? items : defaultSocialItems();
}

/** Parse and sanitize an unknown JSON value into a PageDocument. */
export function parseDocument(raw: unknown): ParseDocumentResult {
  if (raw == null) return { ok: true, document: emptyDocument() };
  if (typeof raw === "string") {
    try {
      return parseDocument(JSON.parse(raw));
    } catch {
      return { ok: false, error: "invalid_json" };
    }
  }
  if (typeof raw !== "object") return { ok: false, error: "invalid_document" };
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 && o.version !== undefined) {
    return { ok: false, error: "unsupported_version" };
  }
  const list = parseBlockList(Array.isArray(o.blocks) ? o.blocks : [], 0);
  if (!list) return { ok: false, error: "invalid_block" };
  if (countBlocks(list) > MAX_BLOCKS) return { ok: false, error: "too_many_blocks" };
  return { ok: true, document: { version: 1, blocks: list } };
}

export function serializeDocument(doc: PageDocument): string {
  return JSON.stringify({ version: 1, blocks: doc.blocks });
}
