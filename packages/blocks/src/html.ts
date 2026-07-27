import type { Block, GalleryImage, LogoItem, PageDocument, TextSize } from "./types";
import { renderRichText } from "./rich-text";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function spacerPx(size: "sm" | "md" | "lg"): number {
  if (size === "sm") return 16;
  if (size === "lg") return 64;
  return 32;
}

function padCss(pad: "sm" | "md" | "lg" | undefined): string {
  if (pad === "sm") return "1rem";
  if (pad === "lg") return "2.5rem";
  return "1.5rem";
}

function gapCss(gap: "sm" | "md" | "lg" | undefined): string {
  if (gap === "sm") return "0.75rem";
  if (gap === "lg") return "2rem";
  return "1.25rem";
}

function alignStyle(align?: "left" | "center" | "right"): string {
  if (!align || align === "left") return "";
  return ` style="text-align:${align}"`;
}

function sizeClass(base: string, size?: TextSize): string {
  if (size === "sm") return `${base} ${base}-sm`;
  if (size === "lg") return `${base} ${base}-lg`;
  return base;
}

function sectionClass(block: Extract<Block, { type: "section" }>): string {
  const parts = ["blk-section"];
  if (block.width === "wide") parts.push("blk-section-wide");
  if (block.width === "full") parts.push("blk-section-full");
  if (block.background === "muted") parts.push("blk-section-muted");
  if (block.background === "accent-soft") parts.push("blk-section-accent");
  return parts.join(" ");
}

function colsClass(block: Extract<Block, { type: "columns" }>): string {
  const parts = ["blk-cols"];
  if (block.ratio === "1-2") parts.push("blk-cols-1-2");
  if (block.ratio === "2-1") parts.push("blk-cols-2-1");
  return parts.join(" ");
}

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "www.loom.com",
  "loom.com",
  "www.cal.com",
  "cal.com",
  "calendly.com",
  "www.calendly.com",
  "maps.google.com",
  "www.google.com",
  "openstreetmap.org",
  "www.openstreetmap.org",
  "codepen.io",
  "codesandbox.io",
  "stackblitz.com",
  "www.figma.com",
  "figma.com",
  "open.spotify.com",
  "spotify.com",
]);

/** Convert watch / share URLs into embeddable iframe src when allowed. */
export function safeEmbedSrc(raw: string): string | null {
  const url = (raw || "").trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (!EMBED_HOSTS.has(host)) return null;

  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
  }
  if (host.includes("youtube")) {
    const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
    if (!id || id === "watch" || id === "embed") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      const vid = embedIdx >= 0 ? parts[embedIdx + 1] : parts[parts.length - 1];
      if (!vid) return null;
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}`;
    }
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
  }
  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    if (!id) return null;
    return `https://player.vimeo.com/video/${encodeURIComponent(id)}`;
  }
  if (host.includes("loom.com") && !parsed.pathname.includes("/embed/")) {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    if (!id) return null;
    return `https://www.loom.com/embed/${encodeURIComponent(id)}`;
  }
  return parsed.toString();
}

function aspectPadding(aspect?: "16-9" | "4-3" | "1-1"): string {
  if (aspect === "4-3") return "75%";
  if (aspect === "1-1") return "100%";
  return "56.25%";
}

export type DocumentRenderContext = {
  /** Published page links for `nav-links` blocks. */
  pages?: { title: string; href: string }[];
};

function renderBlocks(blocks: Block[], ctx: DocumentRenderContext): string {
  return blocks.map((b) => renderBlock(b, ctx)).filter(Boolean).join("\n");
}

function renderBlock(block: Block, ctx: DocumentRenderContext): string {
  switch (block.type) {
    case "heading": {
      const tag = `h${block.level}` as "h1" | "h2" | "h3";
      const base =
        block.level === 1 ? "blk-h1" : block.level === 3 ? "blk-h3" : "blk-h2";
      return `<${tag} class="${sizeClass(base, block.size)}"${alignStyle(block.align)}>${renderRichText(block.text)}</${tag}>`;
    }
    case "paragraph":
      return `<p class="${sizeClass("blk-p", block.size)}"${alignStyle(block.align)}>${renderRichText(block.text)}</p>`;
    case "image": {
      const src = (block.src || "").trim();
      if (!src) return "";
      const alt = escapeAttr(block.alt || "");
      const width =
        block.width === "wide"
          ? "blk-fig blk-fig-wide"
          : block.width === "full"
            ? "blk-fig blk-fig-full"
            : "blk-fig";
      const radius =
        block.radius === "none"
          ? "blk-img blk-img-square"
          : block.radius === "lg"
            ? "blk-img blk-img-lg"
            : "blk-img";
      const caption = (block.caption || "").trim();
      return `<figure class="${width}"><img class="${radius}" src="${escapeAttr(src)}" alt="${alt}" loading="lazy"/>${
        caption ? `<figcaption class="blk-caption">${escapeHtml(caption)}</figcaption>` : ""
      }</figure>`;
    }
    case "button": {
      const href = (block.href || "#").trim() || "#";
      const wrap =
        block.align === "center"
          ? "blk-cta blk-cta-center"
          : block.align === "right"
            ? "blk-cta blk-cta-right"
            : "blk-cta";
      const variant =
        block.variant === "outline"
          ? "blk-btn blk-btn-outline"
          : block.variant === "ghost"
            ? "blk-btn blk-btn-ghost"
            : "blk-btn";
      return `<p class="${wrap}"><a class="${variant}" href="${escapeAttr(href)}">${renderRichText(block.label || "Button")}</a></p>`;
    }
    case "quote": {
      const cite = (block.cite || "").trim();
      return `<blockquote class="blk-quote"${alignStyle(block.align)}><p>${renderRichText(block.text)}</p>${
        cite ? `<cite>${renderRichText(cite)}</cite>` : ""
      }</blockquote>`;
    }
    case "list": {
      const tag = block.style === "ol" ? "ol" : "ul";
      const items = block.items
        .map((item) => `<li>${renderRichText(item)}</li>`)
        .join("");
      return `<${tag} class="blk-list">${items}</${tag}>`;
    }
    case "link": {
      const href = (block.href || "/").trim() || "/";
      return `<a class="blk-link" href="${escapeAttr(href)}">${renderRichText(block.label || "Link")}</a>`;
    }
    case "nav-links": {
      const max = block.max ?? 6;
      const pages = (ctx.pages || []).slice(0, max);
      if (!pages.length) {
        return `<nav class="blk-nav"><span class="muted">No pages yet</span></nav>`;
      }
      return `<nav class="blk-nav">${pages
        .map(
          (p) =>
            `<a class="blk-nav-a" href="${escapeAttr(p.href)}">${escapeHtml(p.title)}</a>`,
        )
        .join("")}</nav>`;
    }
    case "divider":
      return `<hr class="blk-hr"/>`;
    case "spacer":
      return `<div class="blk-spacer" style="height:${spacerPx(block.size)}px" aria-hidden="true"></div>`;
    case "section":
      return `<section class="${sectionClass(block)}" style="padding:${padCss(block.pad)} 0">${renderBlocks(block.blocks, ctx)}</section>`;
    case "columns":
      return `<div class="${colsClass(block)}" style="gap:${gapCss(block.gap)}"><div class="blk-col">${renderBlocks(block.columns[0], ctx)}</div><div class="blk-col">${renderBlocks(block.columns[1], ctx)}</div></div>`;
    case "form": {
      const title = (block.title || "").trim();
      const success = escapeAttr(block.successMessage || "Got it. We will read this.");
      const fields = block.fields
        .map((f) => {
          const req = f.required ? " required" : "";
          const label = escapeHtml(f.label || f.name);
          const name = escapeAttr(f.name);
          const id = escapeAttr(`${block.id}_${f.id}`);
          if (f.kind === "textarea") {
            return `<label class="blk-form-field" for="${id}"><span>${label}</span><textarea id="${id}" name="${name}" rows="4"${req}></textarea></label>`;
          }
          if (f.kind === "select") {
            const opts = (f.options?.length ? f.options : ["Option A", "Option B"])
              .map((opt) => `<option value="${escapeAttr(opt)}">${escapeHtml(opt)}</option>`)
              .join("");
            return `<label class="blk-form-field" for="${id}"><span>${label}</span><select id="${id}" name="${name}"${req}>${opts}</select></label>`;
          }
          const inputType = f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : "text";
          return `<label class="blk-form-field" for="${id}"><span>${label}</span><input id="${id}" type="${inputType}" name="${name}"${req}/></label>`;
        })
        .join("");
      const heading = title
        ? `<p class="blk-form-title">${escapeHtml(title)}</p>`
        : "";
      return `<form class="blk-form" data-kumooo-form data-form-id="${escapeAttr(block.id)}" data-success="${success}" novalidate>${heading}${fields}<button class="blk-form-submit" type="submit">${escapeHtml(block.submitLabel || "Send")}</button><p class="blk-form-status" hidden aria-live="polite"></p></form>`;
    }
    case "badge": {
      const tone =
        block.tone === "muted"
          ? "blk-badge blk-badge-muted"
          : block.tone === "fg"
            ? "blk-badge blk-badge-fg"
            : "blk-badge";
      return `<p class="${tone}">${renderRichText(block.text || "Badge")}</p>`;
    }
    case "callout": {
      const tone =
        block.tone === "accent"
          ? "blk-callout blk-callout-accent"
          : block.tone === "warn"
            ? "blk-callout blk-callout-warn"
            : "blk-callout";
      return `<aside class="${tone}">${renderRichText(block.text)}</aside>`;
    }
    case "video":
    case "embed": {
      const src = safeEmbedSrc(block.url);
      if (!src) {
        return `<p class="blk-p muted">Embed URL not allowed or empty.</p>`;
      }
      const aspect = block.type === "embed" ? block.aspect : "16-9";
      const title =
        block.type === "video" ? escapeAttr(block.title || "Video") : "Embed";
      return `<div class="blk-embed" style="padding-top:${aspectPadding(aspect)}"><iframe src="${escapeAttr(src)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    case "feature":
      return `<div class="blk-feature"${alignStyle(block.align)}><p class="blk-feature-title">${renderRichText(block.title || "Feature")}</p><p class="blk-feature-body">${renderRichText(block.body)}</p></div>`;
    case "social-links": {
      if (!block.items.length) return "";
      return `<nav class="blk-social">${block.items
        .map(
          (item) =>
            `<a class="blk-social-a" href="${escapeAttr(item.href || "#")}" rel="noopener noreferrer" target="_blank">${escapeHtml(item.label || "Link")}</a>`,
        )
        .join("")}</nav>`;
    }
    case "hero": {
      const align = block.align || "center";
      const alignStyle2 = align === "center" ? " blk-hero-center" : align === "right" ? " blk-hero-right" : "";
      const bgClass =
        block.background === "muted"
          ? " blk-hero-muted"
          : block.background === "accent-soft"
            ? " blk-hero-accent"
            : "";
      const btn =
        block.buttonLabel
          ? `<p class="blk-cta${align === "center" ? " blk-cta-center" : align === "right" ? " blk-cta-right" : ""}"><a class="blk-btn" href="${escapeAttr(block.buttonHref || "#")}">${escapeHtml(block.buttonLabel)}</a></p>`
          : "";
      const sub = block.subtext
        ? `<p class="blk-hero-sub">${escapeHtml(block.subtext)}</p>`
        : "";
      return `<div class="blk-hero${alignStyle2}${bgClass}"><h1 class="blk-hero-heading">${escapeHtml(block.heading || "")}</h1>${sub}${btn}</div>`;
    }
    case "stats": {
      const align = block.align || "center";
      const alignClass = align === "center" ? " blk-stats-center" : align === "right" ? " blk-stats-right" : "";
      const items = block.items
        .map(
          (item) =>
            `<div class="blk-stat"><span class="blk-stat-value">${escapeHtml(item.value || "")}</span><span class="blk-stat-label">${escapeHtml(item.label || "")}</span></div>`,
        )
        .join("");
      return `<div class="blk-stats${alignClass}">${items}</div>`;
    }
    case "gallery": {
      const cols = block.columns ?? 3;
      const colClass = cols === 2 ? "blk-gallery-2" : cols === 4 ? "blk-gallery-4" : "blk-gallery-3";
      const radiusClass =
        block.radius === "none" ? " blk-gallery-r0" : block.radius === "lg" ? " blk-gallery-rlg" : "";
      const imgs = (block.images as GalleryImage[])
        .filter((img) => img.src)
        .map(
          (img) =>
            `<img class="blk-gallery-img${radiusClass}" src="${escapeAttr(img.src!)}" alt="${escapeAttr(img.alt || "")}" loading="lazy"/>`,
        )
        .join("");
      return imgs ? `<div class="blk-gallery ${colClass}">${imgs}</div>` : "";
    }
    case "logo-strip": {
      const label = (block.label || "").trim();
      const logos = (block.logos as LogoItem[])
        .filter((l) => l.src)
        .map(
          (l) =>
            `<img class="blk-logo-img" src="${escapeAttr(l.src!)}" alt="${escapeAttr(l.alt || "")}" loading="lazy"/>`,
        )
        .join("");
      const heading = label ? `<p class="blk-logo-label">${escapeHtml(label)}</p>` : "";
      return logos ? `<div class="blk-logo-strip">${heading}<div class="blk-logo-row">${logos}</div></div>` : "";
    }
    case "faq": {
      const items = block.items
        .map(
          (item) =>
            `<details class="blk-faq-item"><summary class="blk-faq-q">${escapeHtml(item.question || "")}</summary><p class="blk-faq-a">${escapeHtml(item.answer || "")}</p></details>`,
        )
        .join("");
      return `<div class="blk-faq">${items}</div>`;
    }
    case "steps": {
      const items = block.items
        .map(
          (item, idx) =>
            `<div class="blk-step"><span class="blk-step-num">${idx + 1}</span><div class="blk-step-body"><p class="blk-step-title">${escapeHtml(item.title || "")}</p><p class="blk-step-desc">${escapeHtml(item.body || "")}</p></div></div>`,
        )
        .join("");
      return `<div class="blk-steps">${items}</div>`;
    }
    case "pricing-card": {
      const hlClass = block.highlighted ? " blk-pricing-hl" : "";
      const features = block.features
        .map((f) => `<li class="blk-pricing-feat">${escapeHtml(f || "")}</li>`)
        .join("");
      const desc = block.description
        ? `<p class="blk-pricing-desc">${escapeHtml(block.description)}</p>`
        : "";
      const btn = block.buttonLabel
        ? `<p class="blk-cta"><a class="blk-btn${block.highlighted ? "" : " blk-btn-outline"}" href="${escapeAttr(block.buttonHref || "#")}">${escapeHtml(block.buttonLabel)}</a></p>`
        : "";
      return `<div class="blk-pricing${hlClass}"><p class="blk-pricing-name">${escapeHtml(block.name || "")}</p><p class="blk-pricing-price">${escapeHtml(block.price || "")}<span class="blk-pricing-period">${escapeHtml(block.period || "")}</span></p>${desc}<ul class="blk-pricing-list">${features}</ul>${btn}</div>`;
    }
    case "testimonial": {
      const avatar = block.avatarSrc
        ? `<img class="blk-testi-avatar" src="${escapeAttr(block.avatarSrc)}" alt="${escapeAttr(block.name || "")}" loading="lazy"/>`
        : `<div class="blk-testi-avatar blk-testi-avatar-placeholder"></div>`;
      const role = block.role
        ? `<span class="blk-testi-role">${escapeHtml(block.role)}</span>`
        : "";
      return `<div class="blk-testi"><p class="blk-testi-quote">${escapeHtml(block.quote || "")}</p><div class="blk-testi-meta">${avatar}<div><span class="blk-testi-name">${escapeHtml(block.name || "")}</span>${role}</div></div></div>`;
    }
    case "alert-banner": {
      const toneClass =
        block.tone === "warn"
          ? " blk-alert-warn"
          : block.tone === "success"
            ? " blk-alert-success"
            : "";
      const dismiss = block.dismissible
        ? `<button class="blk-alert-close" type="button" aria-label="Dismiss" onclick="this.closest('.blk-alert').remove()">×</button>`
        : "";
      return `<div class="blk-alert${toneClass}" role="alert">${escapeHtml(block.text || "")}${dismiss}</div>`;
    }
    case "breadcrumb": {
      const items = block.items
        .map((item, idx) => {
          const isLast = idx === block.items.length - 1;
          const sep = idx > 0 ? `<span class="blk-crumb-sep" aria-hidden="true">/</span>` : "";
          const content = item.href && !isLast
            ? `<a class="blk-crumb-a" href="${escapeAttr(item.href)}">${escapeHtml(item.label || "")}</a>`
            : `<span class="blk-crumb-current" aria-current="page">${escapeHtml(item.label || "")}</span>`;
          return `${sep}${content}`;
        })
        .join("");
      return `<nav class="blk-crumb" aria-label="Breadcrumb">${items}</nav>`;
    }
  }
}

/** CSS snippet for block HTML inside the hosted shell. */
export function blockDocumentCss(): string {
  return [
    `.blk-h1{font-size:clamp(2rem,5vw,3rem);letter-spacing:-.03em;margin:.2rem 0 1rem;font-weight:700}`,
    `.blk-h1-sm{font-size:clamp(1.6rem,4vw,2.25rem)}`,
    `.blk-h1-lg{font-size:clamp(2.4rem,6vw,3.5rem)}`,
    `.blk-h2{font-size:clamp(1.4rem,3vw,1.85rem);letter-spacing:-.02em;margin:1.5rem 0 .75rem;font-weight:700}`,
    `.blk-h2-sm{font-size:clamp(1.15rem,2.5vw,1.4rem)}`,
    `.blk-h2-lg{font-size:clamp(1.7rem,3.5vw,2.2rem)}`,
    `.blk-h3{font-size:1.15rem;margin:1.25rem 0 .5rem;font-weight:650}`,
    `.blk-h3-sm{font-size:1rem}`,
    `.blk-h3-lg{font-size:1.35rem}`,
    `.blk-p{line-height:1.65;margin:0 0 1rem;white-space:pre-wrap}`,
    `.blk-p-sm{font-size:.9rem}`,
    `.blk-p-lg{font-size:1.125rem}`,
    `.blk-fig{margin:0 0 1.25rem;max-width:720px}`,
    `.blk-fig-wide{max-width:960px}`,
    `.blk-fig-full{max-width:none;width:100%}`,
    `.blk-img{width:100%;border-radius:12px;display:block;background:var(--line)}`,
    `.blk-img-square{border-radius:0}`,
    `.blk-img-lg{border-radius:20px}`,
    `.blk-caption{margin-top:.5rem;font-size:13px;color:var(--muted,var(--fog,#888))}`,
    `.blk-cta{margin:1.25rem 0}`,
    `.blk-cta-center{text-align:center}`,
    `.blk-cta-right{text-align:right}`,
    `.blk-btn{display:inline-flex;align-items:center;justify-content:center;padding:.7rem 1.1rem;border-radius:999px;background:var(--fg);color:var(--bg);text-decoration:none;font-weight:600;font-size:14px;border:1px solid transparent}`,
    `.blk-btn-outline{background:transparent;color:var(--fg);border-color:var(--line)}`,
    `.blk-btn-ghost{background:transparent;color:var(--fg);border-color:transparent;text-decoration:underline;text-underline-offset:3px;border-radius:0;padding:.35rem 0}`,
    `.blk-hr{border:0;border-top:1px solid var(--line);margin:1.5rem 0}`,
    `.blk-spacer{width:100%}`,
    `.blk-quote{margin:1.25rem 0;padding:.25rem 0 .25rem 1rem;border-left:3px solid var(--accent,var(--mint,#0d9488));color:var(--fog,#888)}`,
    `.blk-quote p{margin:0 0 .5rem;font-size:1.05rem;line-height:1.55;font-style:italic}`,
    `.blk-quote cite{font-size:.85rem;font-style:normal;opacity:.85}`,
    `.blk-list{margin:0 0 1rem;padding-left:1.25rem;line-height:1.65}`,
    `.blk-list li{margin:.35rem 0}`,
    `.blk-link{color:var(--accent,var(--mint,#0d9488));text-decoration:underline;text-underline-offset:3px;font-weight:600}`,
    `.blk-nav{display:flex;flex-wrap:wrap;gap:.75rem 1rem;align-items:center;margin:.5rem 0}`,
    `.blk-nav-a{font-size:13px;color:var(--muted,var(--fog,#888));text-decoration:none}`,
    `.blk-nav-a:hover{color:var(--fg)}`,
    `.site-chrome{border-bottom:1px solid var(--line);padding:.85rem 0;background:color-mix(in srgb,var(--card,#fff) 85%,transparent)}`,
    `.site-chrome-inner{max-width:960px;margin:0 auto;padding:0 1.25rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem}`,
    `.site-chrome .blk-h1,.site-chrome .blk-h2,.site-chrome .blk-h3{margin:0;font-size:1.05rem}`,
    `.site-chrome .blk-p{margin:0;font-size:13px}`,
    `.site-footer{border-top:1px solid var(--line);padding:1.5rem 0 2rem;margin-top:2rem}`,
    `.site-footer-inner{max-width:720px;margin:0 auto;padding:0 1.25rem}`,
    `.blk-section{margin:1rem auto;max-width:720px}`,
    `.blk-section-wide{max-width:960px}`,
    `.blk-section-full{max-width:none;width:100%}`,
    `.blk-section-muted{background:color-mix(in srgb,var(--fg) 4%,transparent);padding-left:1rem;padding-right:1rem;border-radius:12px}`,
    `.blk-section-accent{background:color-mix(in srgb,var(--accent,#0d9488) 12%,transparent);padding-left:1rem;padding-right:1rem;border-radius:12px}`,
    `.blk-cols{display:grid;grid-template-columns:1fr;margin:1rem 0}`,
    `@media(min-width:640px){.blk-cols{grid-template-columns:1fr 1fr}.blk-cols-1-2{grid-template-columns:1fr 2fr}.blk-cols-2-1{grid-template-columns:2fr 1fr}}`,
    `.blk-form{display:flex;flex-direction:column;gap:.85rem;margin:1.25rem 0;max-width:28rem}`,
    `.blk-form-title{font-weight:650;margin:0;font-size:1.05rem}`,
    `.blk-form-field{display:flex;flex-direction:column;gap:.35rem;font-size:13px;color:var(--muted,var(--fog,#888))}`,
    `.blk-form-field span{font-weight:600;color:var(--fg)}`,
    `.blk-form-field input,.blk-form-field textarea,.blk-form-field select{font:inherit;color:var(--fg);background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--line);border-radius:10px;padding:.65rem .75rem}`,
    `.blk-form-field textarea{resize:vertical;min-height:6rem}`,
    `.blk-form-submit{align-self:flex-start;display:inline-flex;align-items:center;justify-content:center;padding:.7rem 1.1rem;border-radius:999px;border:0;background:var(--fg);color:var(--bg);font-weight:600;font-size:14px;cursor:pointer}`,
    `.blk-form-submit:disabled{opacity:.55;cursor:wait}`,
    `.blk-form-status{margin:0;font-size:14px;color:var(--muted,var(--fog,#888))}`,
    `.blk-form-status.is-ok{color:var(--accent,var(--mint,#0d9488))}`,
    `.blk-form-status.is-err{color:#c2410c}`,
    `.blk-badge{display:inline-flex;align-items:center;margin:0 0 .75rem;padding:.28rem .7rem;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:color-mix(in srgb,var(--accent,#0d9488) 18%,transparent);color:var(--accent,#0d9488)}`,
    `.blk-badge-muted{background:color-mix(in srgb,var(--fg) 8%,transparent);color:var(--muted,var(--fog,#888))}`,
    `.blk-badge-fg{background:var(--fg);color:var(--bg)}`,
    `.blk-callout{margin:1rem 0;padding:1rem 1.1rem;border-radius:12px;line-height:1.55;background:color-mix(in srgb,var(--fg) 5%,transparent);border:1px solid var(--line)}`,
    `.blk-callout-accent{background:color-mix(in srgb,var(--accent,#0d9488) 12%,transparent);border-color:transparent}`,
    `.blk-callout-warn{background:color-mix(in srgb,#c2410c 12%,transparent);border-color:transparent}`,
    `.blk-embed{position:relative;width:100%;margin:1.25rem 0;border-radius:12px;overflow:hidden;background:var(--line)}`,
    `.blk-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}`,
    `.blk-feature{margin:1rem 0 1.25rem}`,
    `.blk-feature-title{margin:0 0 .35rem;font-size:1.1rem;font-weight:650;letter-spacing:-.02em}`,
    `.blk-feature-body{margin:0;line-height:1.6;color:var(--muted,var(--fog,#888))}`,
    `.blk-social{display:flex;flex-wrap:wrap;gap:.65rem .9rem;margin:1rem 0}`,
    `.blk-social-a{font-size:13px;font-weight:600;color:var(--fg);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px}`,
    `.blk-social-a:hover{border-color:var(--accent,var(--mint,#0d9488));color:var(--accent,var(--mint,#0d9488))}`,
    `.blk-hero{margin:2rem auto 1.5rem;max-width:720px;padding:2.5rem 1rem}`,
    `.blk-hero-center{text-align:center}`,
    `.blk-hero-right{text-align:right}`,
    `.blk-hero-muted{background:color-mix(in srgb,var(--fg) 4%,transparent);border-radius:16px}`,
    `.blk-hero-accent{background:color-mix(in srgb,var(--accent,#0d9488) 12%,transparent);border-radius:16px}`,
    `.blk-hero-heading{font-size:clamp(2.25rem,6vw,3.5rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin:0 0 .75rem}`,
    `.blk-hero-sub{font-size:clamp(1rem,2.5vw,1.2rem);color:var(--fog,#888);line-height:1.55;margin:0 0 1.5rem}`,
    `.blk-stats{display:flex;flex-wrap:wrap;gap:1.5rem 2.5rem;margin:1.5rem 0}`,
    `.blk-stats-center{justify-content:center}`,
    `.blk-stats-right{justify-content:flex-end}`,
    `.blk-stat{display:flex;flex-direction:column;gap:.2rem}`,
    `.blk-stat-value{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1}`,
    `.blk-stat-label{font-size:13px;color:var(--fog,#888)}`,
    `.blk-gallery{display:grid;gap:.75rem;margin:1.25rem 0}`,
    `.blk-gallery-2{grid-template-columns:repeat(2,1fr)}`,
    `.blk-gallery-3{grid-template-columns:repeat(3,1fr)}`,
    `.blk-gallery-4{grid-template-columns:repeat(4,1fr)}`,
    `@media(max-width:480px){.blk-gallery-3,.blk-gallery-4{grid-template-columns:repeat(2,1fr)}}`,
    `.blk-gallery-img{width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:10px;background:var(--line)}`,
    `.blk-gallery-r0{border-radius:0}`,
    `.blk-gallery-rlg{border-radius:18px}`,
    `.blk-logo-strip{margin:1.5rem 0;text-align:center}`,
    `.blk-logo-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--fog,#888);margin:0 0 .9rem}`,
    `.blk-logo-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.25rem 2rem}`,
    `.blk-logo-img{height:2rem;width:auto;object-fit:contain;opacity:.65}`,
    `.blk-faq{margin:1rem 0;display:flex;flex-direction:column;gap:.5rem}`,
    `.blk-faq-item{border:1px solid var(--line);border-radius:10px;overflow:hidden}`,
    `.blk-faq-q{padding:.8rem 1rem;font-weight:600;font-size:.95rem;cursor:pointer;list-style:none;user-select:none}`,
    `.blk-faq-q::-webkit-details-marker{display:none}`,
    `.blk-faq-a{padding:.1rem 1rem 1rem;font-size:.9rem;line-height:1.6;color:var(--fog,#888);margin:0}`,
    `.blk-steps{margin:1.25rem 0;display:flex;flex-direction:column;gap:1.25rem}`,
    `.blk-step{display:flex;gap:1rem;align-items:flex-start}`,
    `.blk-step-num{flex-shrink:0;width:2rem;height:2rem;border-radius:999px;background:color-mix(in srgb,var(--accent,#0d9488) 15%,transparent);color:var(--accent,#0d9488);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}`,
    `.blk-step-body{padding-top:.2rem}`,
    `.blk-step-title{margin:0 0 .3rem;font-weight:650;font-size:1rem}`,
    `.blk-step-desc{margin:0;font-size:.9rem;line-height:1.55;color:var(--fog,#888)}`,
    `.blk-pricing{margin:1.25rem 0;padding:1.5rem;border:1px solid var(--line);border-radius:16px;max-width:22rem}`,
    `.blk-pricing-hl{border-color:var(--accent,#0d9488);box-shadow:0 0 0 1px var(--accent,#0d9488)}`,
    `.blk-pricing-name{margin:0 0 .5rem;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fog,#888)}`,
    `.blk-pricing-price{margin:0 0 .5rem;font-size:2.2rem;font-weight:700;letter-spacing:-.03em;line-height:1}`,
    `.blk-pricing-period{font-size:.95rem;font-weight:400;color:var(--fog,#888)}`,
    `.blk-pricing-desc{margin:.5rem 0 1rem;font-size:.9rem;color:var(--fog,#888);line-height:1.5}`,
    `.blk-pricing-list{margin:0 0 1.25rem;padding-left:1.1rem;font-size:.9rem;line-height:1.7}`,
    `.blk-pricing-feat{margin:.2rem 0}`,
    `.blk-testi{margin:1.25rem 0;padding:1.25rem 1.5rem;border-left:3px solid var(--accent,#0d9488);border-radius:0 12px 12px 0;background:color-mix(in srgb,var(--fg) 3%,transparent)}`,
    `.blk-testi-quote{margin:0 0 1rem;font-size:1.05rem;line-height:1.6;font-style:italic}`,
    `.blk-testi-meta{display:flex;align-items:center;gap:.75rem}`,
    `.blk-testi-avatar{width:2.5rem;height:2.5rem;border-radius:999px;object-fit:cover;flex-shrink:0}`,
    `.blk-testi-avatar-placeholder{background:color-mix(in srgb,var(--fg) 12%,transparent)}`,
    `.blk-testi-name{font-weight:650;font-size:.9rem;display:block}`,
    `.blk-testi-role{font-size:.8rem;color:var(--fog,#888)}`,
    `.blk-alert{position:relative;padding:.85rem 2.5rem .85rem 1rem;border-radius:10px;font-size:.9rem;line-height:1.5;background:color-mix(in srgb,var(--fg) 6%,transparent);border:1px solid var(--line);margin:1rem 0}`,
    `.blk-alert-warn{background:color-mix(in srgb,#d97706 14%,transparent);border-color:color-mix(in srgb,#d97706 40%,transparent)}`,
    `.blk-alert-success{background:color-mix(in srgb,var(--accent,#0d9488) 12%,transparent);border-color:color-mix(in srgb,var(--accent,#0d9488) 35%,transparent)}`,
    `.blk-alert-close{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:transparent;border:0;font-size:1.1rem;cursor:pointer;color:var(--fog,#888);padding:.15rem .3rem;line-height:1}`,
    `.blk-crumb{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .4rem;margin:.75rem 0;font-size:13px}`,
    `.blk-crumb-sep{color:var(--fog,#888);opacity:.6}`,
    `.blk-crumb-a{color:var(--fg);text-decoration:underline;text-underline-offset:2px}`,
    `.blk-crumb-current{color:var(--fog,#888)}`,
  ].join("");
}

export function renderDocumentToHtml(
  doc: PageDocument | null | undefined,
  ctx: DocumentRenderContext = {},
): string {
  if (!doc || !doc.blocks?.length) {
    return `<p class="blk-p muted">This page is empty.</p>`;
  }
  return renderBlocks(doc.blocks, ctx);
}
