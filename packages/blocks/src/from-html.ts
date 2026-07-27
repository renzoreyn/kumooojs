import {
  defaultFormFields,
  defaultSocialItems,
  emptyDocument,
  newBlockId,
  newFieldId,
  type Block,
  type FormField,
  type FormFieldKind,
  type PageDocument,
} from "./types";
import type { ParseDocumentResult } from "./parse";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<br\s*\/?>/gi, "\n");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).trim();
}

function attr(tag: string, name: string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  if (!m) return "";
  return m[2] ?? m[3] ?? m[4] ?? "";
}

function hasClass(tag: string, cls: string): boolean {
  const c = attr(tag, "class");
  return c.split(/\s+/).includes(cls);
}

/** Round-trip HTML for the builder (simple tags, no skin chrome). */
export function documentToEditableHtml(doc: PageDocument): string {
  return blocksToHtml(doc.blocks).trim() + "\n";
}

function blocksToHtml(blocks: Block[]): string {
  return blocks.map(blockToHtml).filter(Boolean).join("\n\n");
}

function blockToHtml(block: Block): string {
  switch (block.type) {
    case "heading":
      return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    case "paragraph":
      return `<p>${escapeHtml(block.text).replace(/\n/g, "<br/>")}</p>`;
    case "image": {
      const src = escapeHtml(block.src || "");
      const alt = escapeHtml(block.alt || "");
      return `<img src="${src}" alt="${alt}" />`;
    }
    case "button":
      return `<a class="btn" href="${escapeHtml(block.href || "#")}">${escapeHtml(block.label || "Button")}</a>`;
    case "link":
      return `<a href="${escapeHtml(block.href || "/")}">${escapeHtml(block.label || "Link")}</a>`;
    case "nav-links":
      return `<nav data-nav-links max="${block.max ?? 6}"></nav>`;
    case "quote": {
      const cite = (block.cite || "").trim();
      return `<blockquote><p>${escapeHtml(block.text).replace(/\n/g, "<br/>")}</p>${
        cite ? `<cite>${escapeHtml(cite)}</cite>` : ""
      }</blockquote>`;
    }
    case "list": {
      const tag = block.style === "ol" ? "ol" : "ul";
      const items = block.items.map((i) => `  <li>${escapeHtml(i)}</li>`).join("\n");
      return `<${tag}>\n${items}\n</${tag}>`;
    }
    case "divider":
      return `<hr />`;
    case "spacer":
      return `<div data-spacer="${block.size}"></div>`;
    case "section":
      return `<section>\n${blocksToHtml(block.blocks)}\n</section>`;
    case "columns":
      return `<div data-columns>\n<div>\n${blocksToHtml(block.columns[0])}\n</div>\n<div>\n${blocksToHtml(block.columns[1])}\n</div>\n</div>`;
    case "form": {
      const title = escapeHtml(block.title || "");
      const fields = block.fields
        .map((f) => {
          const attrs = [
            `data-field-id="${escapeHtml(f.id)}"`,
            `data-name="${escapeHtml(f.name)}"`,
            `data-kind="${escapeHtml(f.kind)}"`,
            f.required ? `data-required="true"` : "",
            f.options?.length ? `data-options="${escapeHtml(f.options.join("|"))}"` : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `  <div data-form-field ${attrs}>${escapeHtml(f.label)}</div>`;
        })
        .join("\n");
      return `<form data-kumooo-form data-submit-label="${escapeHtml(block.submitLabel || "Send")}" data-success="${escapeHtml(block.successMessage || "")}" data-title="${title}">\n${fields}\n</form>`;
    }
    case "badge":
      return `<span data-badge data-tone="${escapeHtml(block.tone || "accent")}">${escapeHtml(block.text)}</span>`;
    case "callout":
      return `<aside data-callout data-tone="${escapeHtml(block.tone || "muted")}">${escapeHtml(block.text).replace(/\n/g, "<br/>")}</aside>`;
    case "video":
      return `<div data-video url="${escapeHtml(block.url)}" title="${escapeHtml(block.title || "")}"></div>`;
    case "embed":
      return `<div data-embed url="${escapeHtml(block.url)}" aspect="${escapeHtml(block.aspect || "16-9")}"></div>`;
    case "feature":
      return `<div data-feature>\n  <h3>${escapeHtml(block.title)}</h3>\n  <p>${escapeHtml(block.body).replace(/\n/g, "<br/>")}</p>\n</div>`;
    case "social-links": {
      const items = block.items
        .map(
          (item) =>
            `  <a data-social href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`,
        )
        .join("\n");
      return `<nav data-social-links>\n${items}\n</nav>`;
    }
    case "hero": {
      const attrs = [
        `data-hero`,
        `data-align="${escapeHtml(block.align || "center")}"`,
        `data-background="${escapeHtml(block.background || "none")}"`,
        block.buttonHref ? `data-button-href="${escapeHtml(block.buttonHref)}"` : "",
        block.buttonLabel ? `data-button-label="${escapeHtml(block.buttonLabel)}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const sub = block.subtext
        ? `\n  <p>${escapeHtml(block.subtext).replace(/\n/g, "<br/>")}</p>`
        : "";
      return `<div ${attrs}>\n  <h1>${escapeHtml(block.heading || "")}</h1>${sub}\n</div>`;
    }
    case "stats": {
      const items = block.items
        .map(
          (item) =>
            `  <div data-stat value="${escapeHtml(item.value)}" label="${escapeHtml(item.label)}"></div>`,
        )
        .join("\n");
      return `<div data-stats data-align="${escapeHtml(block.align || "center")}">\n${items}\n</div>`;
    }
    case "gallery": {
      const imgs = block.images
        .map(
          (img) =>
            `  <img src="${escapeHtml(img.src || "")}" alt="${escapeHtml(img.alt || "")}" />`,
        )
        .join("\n");
      return `<div data-gallery columns="${block.columns ?? 3}" radius="${escapeHtml(block.radius || "md")}">\n${imgs}\n</div>`;
    }
    case "logo-strip": {
      const logos = block.logos
        .map(
          (logo) =>
            `  <img src="${escapeHtml(logo.src || "")}" alt="${escapeHtml(logo.alt || "")}" />`,
        )
        .join("\n");
      return `<div data-logo-strip label="${escapeHtml(block.label || "")}">\n${logos}\n</div>`;
    }
    case "faq": {
      const items = block.items
        .map(
          (item) =>
            `  <details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer).replace(/\n/g, "<br/>")}</p></details>`,
        )
        .join("\n");
      return `<div data-faq>\n${items}\n</div>`;
    }
    case "steps": {
      const items = block.items
        .map(
          (item) =>
            `  <div data-step>\n    <h3>${escapeHtml(item.title)}</h3>\n    <p>${escapeHtml(item.body).replace(/\n/g, "<br/>")}</p>\n  </div>`,
        )
        .join("\n");
      return `<div data-steps>\n${items}\n</div>`;
    }
    case "pricing-card": {
      const feats = block.features
        .map((f) => `  <li>${escapeHtml(f)}</li>`)
        .join("\n");
      const attrs = [
        `data-pricing-card`,
        `data-name="${escapeHtml(block.name)}"`,
        `data-price="${escapeHtml(block.price)}"`,
        block.period ? `data-period="${escapeHtml(block.period)}"` : "",
        block.buttonLabel ? `data-button-label="${escapeHtml(block.buttonLabel)}"` : "",
        block.buttonHref ? `data-button-href="${escapeHtml(block.buttonHref)}"` : "",
        block.highlighted ? `data-highlighted="true"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const desc = block.description
        ? `\n  <p>${escapeHtml(block.description)}</p>`
        : "";
      return `<div ${attrs}>${desc}\n  <ul>\n${feats}\n  </ul>\n</div>`;
    }
    case "testimonial": {
      const attrs = [
        `data-testimonial`,
        `data-name="${escapeHtml(block.name)}"`,
        block.role ? `data-role="${escapeHtml(block.role)}"` : "",
        block.avatarSrc ? `data-avatar="${escapeHtml(block.avatarSrc)}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<blockquote ${attrs}><p>${escapeHtml(block.quote).replace(/\n/g, "<br/>")}</p></blockquote>`;
    }
    case "alert-banner": {
      const attrs = [
        `data-alert-banner`,
        `data-tone="${escapeHtml(block.tone || "info")}"`,
        block.dismissible ? `data-dismissible="true"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<div ${attrs}>${escapeHtml(block.text).replace(/\n/g, "<br/>")}</div>`;
    }
    case "breadcrumb": {
      const items = block.items
        .map((item) =>
          item.href
            ? `  <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
            : `  <span>${escapeHtml(item.label)}</span>`,
        )
        .join("\n");
      return `<nav data-breadcrumb>\n${items}\n</nav>`;
    }
    case "html":
      return `<div data-custom-html>${block.html || ""}</div>`;
  }
}

/**
 * Parse a small HTML subset into a page document.
 * Supported: h1–h3, p, img, a, a.btn, ul/ol, hr, blockquote, section, nav[data-nav-links], div[data-columns], div[data-spacer], form[data-kumooo-form], span[data-badge], aside[data-callout], div[data-video], div[data-embed], div[data-feature], nav[data-social-links].
 */
export function parseHtmlDocument(raw: string): ParseDocumentResult {
  const html = String(raw ?? "").trim();
  if (!html) return { ok: true, document: emptyDocument() };
  try {
    const blocks = parseBlockHtml(html);
    if (blocks == null) return { ok: false, error: "invalid_html" };
    return { ok: true, document: { version: 1, blocks } };
  } catch {
    return { ok: false, error: "invalid_html" };
  }
}

function parseBlockHtml(html: string): Block[] | null {
  const blocks: Block[] = [];
  let i = 0;
  const s = html.trim();

  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i += 1;
    if (i >= s.length) break;
    if (s[i] !== "<") {
      const text = s.slice(i).split(/</)[0] || "";
      i += text.length;
      const t = text.trim();
      if (t) blocks.push({ id: newBlockId(), type: "paragraph", text: decodeEntities(t) });
      continue;
    }

    const openEnd = s.indexOf(">", i);
    if (openEnd < 0) return null;
    const openTag = s.slice(i, openEnd + 1);
    const tagMatch = openTag.match(/^<\/?\s*([a-zA-Z0-9-]+)/);
    if (!tagMatch) return null;
    const name = tagMatch[1]!.toLowerCase();
    const selfClosing = /\/\s*>$/.test(openTag) || name === "img" || name === "hr";

    if (openTag.startsWith("</")) {
      i = openEnd + 1;
      continue;
    }

    if (selfClosing) {
      const b = parseVoid(name, openTag);
      if (b) blocks.push(b);
      i = openEnd + 1;
      continue;
    }

    const close = findClose(s, name, openEnd + 1);
    if (!close) return null;
    const inner = s.slice(openEnd + 1, close.start);
    const b = parseElement(name, openTag, inner);
    if (b) blocks.push(b);
    i = close.end;
  }

  return blocks;
}

function findClose(s: string, name: string, from: number): { start: number; end: number } | null {
  let depth = 1;
  let i = from;
  const openRe = new RegExp(`<${name}\\b[^>]*>`, "gi");
  const closeRe = new RegExp(`</${name}\\s*>`, "gi");
  while (i < s.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const open = openRe.exec(s);
    const close = closeRe.exec(s);
    if (!close) return null;
    if (open && open.index < close.index) {
      if (!/\/\s*>$/.test(open[0])) depth += 1;
      i = open.index + open[0].length;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return { start: close.index, end: close.index + close[0].length };
    }
    i = close.index + close[0].length;
  }
  return null;
}

function parseVoid(name: string, openTag: string): Block | null {
  if (name === "hr") return { id: newBlockId(), type: "divider" };
  if (name === "img") {
    return {
      id: newBlockId(),
      type: "image",
      src: attr(openTag, "src"),
      alt: attr(openTag, "alt"),
    };
  }
  if (name === "nav" && /data-nav-links/i.test(openTag)) {
    const maxRaw = Number(attr(openTag, "max") || 6);
    const max = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.min(20, Math.floor(maxRaw)) : 6;
    return { id: newBlockId(), type: "nav-links", max };
  }
  if (name === "div" && /data-spacer/i.test(openTag)) {
    const sizeRaw = attr(openTag, "data-spacer");
    const size = sizeRaw === "sm" || sizeRaw === "lg" ? sizeRaw : "md";
    return { id: newBlockId(), type: "spacer", size };
  }
  if (name === "div" && /data-video/i.test(openTag)) {
    return {
      id: newBlockId(),
      type: "video",
      url: attr(openTag, "url") || attr(openTag, "data-url"),
      title: attr(openTag, "title"),
    };
  }
  if (name === "div" && /data-embed/i.test(openTag)) {
    const aspectRaw = attr(openTag, "aspect") || attr(openTag, "data-aspect");
    const aspect =
      aspectRaw === "4-3" || aspectRaw === "1-1" || aspectRaw === "16-9" ? aspectRaw : "16-9";
    return {
      id: newBlockId(),
      type: "embed",
      url: attr(openTag, "url") || attr(openTag, "data-url"),
      aspect,
    };
  }
  return null;
}

function parseElement(name: string, openTag: string, inner: string): Block | null {
  if (name === "h1" || name === "h2" || name === "h3") {
    const level = Number(name[1]) as 1 | 2 | 3;
    return { id: newBlockId(), type: "heading", level, text: stripTags(inner) };
  }
  if (name === "p") {
    return {
      id: newBlockId(),
      type: "paragraph",
      text: decodeEntities(inner.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")),
    };
  }
  if (name === "a") {
    const href = attr(openTag, "href") || "#";
    const label = stripTags(inner) || "Link";
    if (hasClass(openTag, "btn") || hasClass(openTag, "button")) {
      return { id: newBlockId(), type: "button", label, href, align: "left" };
    }
    return { id: newBlockId(), type: "link", label, href };
  }
  if (name === "ul" || name === "ol") {
    const items: string[] = [];
    const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      items.push(stripTags(m[1] || ""));
    }
    return {
      id: newBlockId(),
      type: "list",
      style: name === "ol" ? "ol" : "ul",
      items: items.length ? items : [""],
    };
  }
  if (name === "blockquote") {
    const p = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const cite = inner.match(/<cite\b[^>]*>([\s\S]*?)<\/cite>/i);
    return {
      id: newBlockId(),
      type: "quote",
      text: p ? stripTags(p[1] || "") : stripTags(inner),
      cite: cite ? stripTags(cite[1] || "") : "",
    };
  }
  if (name === "section") {
    const nested = parseBlockHtml(inner);
    if (!nested) return null;
    return {
      id: newBlockId(),
      type: "section",
      pad: "md",
      width: "content",
      background: "none",
      blocks: nested.length ? nested : [{ id: newBlockId(), type: "paragraph", text: "" }],
    };
  }
  if (name === "div" && /data-columns/i.test(openTag)) {
    const cols = [...inner.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi)].map((m) => m[1] || "");
    const left = parseBlockHtml(cols[0] || "") || [];
    const right = parseBlockHtml(cols[1] || "") || [];
    return {
      id: newBlockId(),
      type: "columns",
      gap: "md",
      ratio: "1-1",
      columns: [
        left.length ? left : [{ id: newBlockId(), type: "paragraph", text: "" }],
        right.length ? right : [{ id: newBlockId(), type: "paragraph", text: "" }],
      ],
    };
  }
  if (name === "form" && /data-kumooo-form/i.test(openTag)) {
    const fields: FormField[] = [];
    const re = /<div\b([^>]*data-form-field[^>]*)>([\s\S]*?)<\/div>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      const tag = m[1] || "";
      const label = stripTags(m[2] || "") || "Field";
      const kindRaw = attr(tag, "data-kind");
      const kind: FormFieldKind =
        kindRaw === "email" ||
        kindRaw === "textarea" ||
        kindRaw === "tel" ||
        kindRaw === "select"
          ? kindRaw
          : "text";
      const optionsRaw = attr(tag, "data-options");
      fields.push({
        id: attr(tag, "data-field-id") || newFieldId(),
        name: attr(tag, "data-name") || "field",
        label,
        kind,
        required: /data-required/i.test(tag),
        options:
          kind === "select"
            ? optionsRaw
              ? optionsRaw.split("|").map((s) => s.trim()).filter(Boolean)
              : ["Option A", "Option B"]
            : undefined,
      });
    }
    return {
      id: newBlockId(),
      type: "form",
      title: attr(openTag, "data-title") || "",
      submitLabel: attr(openTag, "data-submit-label") || "Send",
      successMessage: attr(openTag, "data-success") || "Got it. We will read this.",
      fields: fields.length ? fields : defaultFormFields(),
    };
  }
  if (name === "span" && /data-badge/i.test(openTag)) {
    const toneRaw = attr(openTag, "data-tone");
    const tone =
      toneRaw === "muted" || toneRaw === "fg" || toneRaw === "accent" ? toneRaw : "accent";
    return { id: newBlockId(), type: "badge", text: stripTags(inner) || "Badge", tone };
  }
  if (name === "aside" && /data-callout/i.test(openTag)) {
    const toneRaw = attr(openTag, "data-tone");
    const tone =
      toneRaw === "accent" || toneRaw === "warn" || toneRaw === "muted" ? toneRaw : "muted";
    return {
      id: newBlockId(),
      type: "callout",
      text: decodeEntities(inner.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")),
      tone,
    };
  }
  if (name === "div" && /data-feature/i.test(openTag)) {
    const h = inner.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const p = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    return {
      id: newBlockId(),
      type: "feature",
      title: h ? stripTags(h[1] || "") : "Feature",
      body: p
        ? decodeEntities((p[1] || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
        : stripTags(inner),
      align: "left",
    };
  }
  if (name === "nav" && /data-social-links/i.test(openTag)) {
    const items: { label: string; href: string }[] = [];
    const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      items.push({
        href: attr(m[1] || "", "href") || "#",
        label: stripTags(m[2] || "") || "Link",
      });
    }
    return {
      id: newBlockId(),
      type: "social-links",
      items: items.length ? items.slice(0, 8) : defaultSocialItems(),
    };
  }
  if (name === "div" && /data-hero/i.test(openTag)) {
    const h = inner.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const p = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const alignRaw = attr(openTag, "data-align");
    const align =
      alignRaw === "left" || alignRaw === "center" || alignRaw === "right" ? alignRaw : "center";
    const bgRaw = attr(openTag, "data-background");
    const background =
      bgRaw === "muted" || bgRaw === "accent-soft" || bgRaw === "none" ? bgRaw : "none";
    return {
      id: newBlockId(),
      type: "hero",
      heading: h ? stripTags(h[1] || "") : "Welcome",
      subtext: p
        ? decodeEntities((p[1] || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
        : "",
      buttonLabel: attr(openTag, "data-button-label") || undefined,
      buttonHref: attr(openTag, "data-button-href") || undefined,
      align,
      background,
    };
  }
  if (name === "div" && /data-stats/i.test(openTag)) {
    const items: { value: string; label: string }[] = [];
    const re = /<div\b([^>]*data-stat[^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      items.push({
        value: attr(m[1] || "", "value") || "0",
        label: attr(m[1] || "", "label") || "Stat",
      });
    }
    const alignRaw = attr(openTag, "data-align");
    const align =
      alignRaw === "left" || alignRaw === "center" || alignRaw === "right" ? alignRaw : "center";
    return {
      id: newBlockId(),
      type: "stats",
      items: items.length ? items.slice(0, 6) : [{ value: "0", label: "Stat" }],
      align,
    };
  }
  if (name === "div" && /data-gallery/i.test(openTag)) {
    const images: { src?: string; alt?: string }[] = [];
    const re = /<img\b([^>]*)\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      images.push({
        src: attr(m[1] || "", "src"),
        alt: attr(m[1] || "", "alt"),
      });
    }
    const colsRaw = Number(attr(openTag, "columns") || 3);
    const columns = colsRaw === 2 || colsRaw === 4 ? colsRaw : 3;
    const radiusRaw = attr(openTag, "radius");
    const radius =
      radiusRaw === "none" || radiusRaw === "md" || radiusRaw === "lg" ? radiusRaw : "md";
    return {
      id: newBlockId(),
      type: "gallery",
      images: images.length ? images.slice(0, 20) : [{ src: "", alt: "" }],
      columns,
      radius,
    };
  }
  if (name === "div" && /data-logo-strip/i.test(openTag)) {
    const logos: { src?: string; alt?: string }[] = [];
    const re = /<img\b([^>]*)\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      logos.push({
        src: attr(m[1] || "", "src"),
        alt: attr(m[1] || "", "alt"),
      });
    }
    return {
      id: newBlockId(),
      type: "logo-strip",
      logos: logos.length ? logos.slice(0, 12) : [{ src: "", alt: "" }],
      label: attr(openTag, "label") || undefined,
    };
  }
  if (name === "div" && /data-faq/i.test(openTag)) {
    const items: { question: string; answer: string }[] = [];
    const re = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      const body = m[1] || "";
      const q = body.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
      const a = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
      items.push({
        question: q ? stripTags(q[1] || "") : "Question",
        answer: a
          ? decodeEntities((a[1] || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
          : stripTags(body),
      });
    }
    return {
      id: newBlockId(),
      type: "faq",
      items: items.length ? items.slice(0, 30) : [{ question: "Question", answer: "Answer" }],
    };
  }
  if (name === "div" && /data-steps/i.test(openTag)) {
    const items: { title: string; body: string }[] = [];
    const re = /<div\b[^>]*data-step[^>]*>([\s\S]*?)<\/div>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      const body = m[1] || "";
      const h = body.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
      const p = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
      items.push({
        title: h ? stripTags(h[1] || "") : "Step",
        body: p
          ? decodeEntities((p[1] || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
          : stripTags(body),
      });
    }
    return {
      id: newBlockId(),
      type: "steps",
      items: items.length ? items.slice(0, 20) : [{ title: "Step", body: "Description" }],
    };
  }
  if (name === "div" && /data-pricing-card/i.test(openTag)) {
    const features: string[] = [];
    const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      features.push(stripTags(m[1] || ""));
    }
    const p = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    return {
      id: newBlockId(),
      type: "pricing-card",
      name: attr(openTag, "data-name") || "Plan",
      price: attr(openTag, "data-price") || "$0",
      period: attr(openTag, "data-period") || undefined,
      description: p ? stripTags(p[1] || "") : undefined,
      features: features.length ? features.slice(0, 20) : ["Feature"],
      buttonLabel: attr(openTag, "data-button-label") || undefined,
      buttonHref: attr(openTag, "data-button-href") || undefined,
      highlighted: /data-highlighted/i.test(openTag),
    };
  }
  if (name === "blockquote" && /data-testimonial/i.test(openTag)) {
    const p = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    return {
      id: newBlockId(),
      type: "testimonial",
      quote: p
        ? decodeEntities((p[1] || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
        : stripTags(inner),
      name: attr(openTag, "data-name") || "Name",
      role: attr(openTag, "data-role") || undefined,
      avatarSrc: attr(openTag, "data-avatar") || undefined,
    };
  }
  if (name === "div" && /data-alert-banner/i.test(openTag)) {
    const toneRaw = attr(openTag, "data-tone");
    const tone =
      toneRaw === "warn" || toneRaw === "success" || toneRaw === "info" ? toneRaw : "info";
    return {
      id: newBlockId(),
      type: "alert-banner",
      text: decodeEntities(inner.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")),
      tone,
      dismissible: /data-dismissible/i.test(openTag),
    };
  }
  if (name === "nav" && /data-breadcrumb/i.test(openTag)) {
    const items: { label: string; href?: string }[] = [];
    const re = /<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      const tag = (m[1] || "").toLowerCase();
      const attrs = m[2] || "";
      const label = stripTags(m[3] || "") || "Page";
      if (tag === "a") {
        items.push({ label, href: attr(attrs, "href") || "/" });
      } else {
        items.push({ label });
      }
    }
    return {
      id: newBlockId(),
      type: "breadcrumb",
      items: items.length ? items.slice(0, 10) : [{ label: "Home", href: "/" }],
    };
  }
  if (name === "div" && (/data-video/i.test(openTag) || /data-embed/i.test(openTag))) {
    return parseVoid("div", openTag);
  }
  if (name === "nav" && /data-nav-links/i.test(openTag)) {
    return parseVoid("nav", openTag);
  }
  if (name === "div" && /data-spacer/i.test(openTag)) {
    return parseVoid("div", openTag);
  }
  // Unknown wrapper: lift children
  const nested = parseBlockHtml(inner);
  if (nested?.length) {
    return nested.length === 1
      ? nested[0]!
      : {
          id: newBlockId(),
          type: "section",
          pad: "md",
          width: "content",
          background: "none",
          blocks: nested,
        };
  }
  const text = stripTags(inner);
  if (text) return { id: newBlockId(), type: "paragraph", text };
  return null;
}
