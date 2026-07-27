export type TextSize = "sm" | "md" | "lg";
export type TextAlign = "left" | "center" | "right";

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
  align?: TextAlign;
  size?: TextSize;
};

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
  align?: TextAlign;
  size?: TextSize;
};

export type ImageBlock = {
  id: string;
  type: "image";
  mediaKey?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: "content" | "wide" | "full";
  radius?: "none" | "md" | "lg";
};

export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  href: string;
  align?: TextAlign;
  variant?: "solid" | "outline" | "ghost";
};

export type DividerBlock = {
  id: string;
  type: "divider";
};

export type SpacerBlock = {
  id: string;
  type: "spacer";
  size: "sm" | "md" | "lg";
};

export type QuoteBlock = {
  id: string;
  type: "quote";
  text: string;
  cite?: string;
  align?: TextAlign;
};

export type ListBlock = {
  id: string;
  type: "list";
  style: "ul" | "ol";
  items: string[];
};

export type LinkBlock = {
  id: string;
  type: "link";
  label: string;
  href: string;
};

/** Auto-links to published site pages (resolved at render time). */
export type NavLinksBlock = {
  id: string;
  type: "nav-links";
  max?: number;
};

/** Soft container with nested blocks. */
export type SectionBlock = {
  id: string;
  type: "section";
  pad?: "sm" | "md" | "lg";
  width?: "content" | "wide" | "full";
  background?: "none" | "muted" | "accent-soft";
  blocks: Block[];
};

/** Two-column layout. */
export type ColumnsBlock = {
  id: string;
  type: "columns";
  gap?: "sm" | "md" | "lg";
  ratio?: "1-1" | "1-2" | "2-1";
  columns: [Block[], Block[]];
};

export type FormFieldKind = "text" | "email" | "textarea" | "tel" | "select";

export type FormField = {
  id: string;
  name: string;
  label: string;
  kind: FormFieldKind;
  required?: boolean;
  /** For `select` fields. */
  options?: string[];
};

/** Contact / lead form. Submissions go to the public API by block id. */
export type FormBlock = {
  id: string;
  type: "form";
  title?: string;
  submitLabel?: string;
  successMessage?: string;
  fields: FormField[];
};

export type BadgeBlock = {
  id: string;
  type: "badge";
  text: string;
  tone?: "accent" | "muted" | "fg";
};

/** Sanitized inline HTML/CSS escape hatch (Cumulus+). */
export type HtmlBlock = {
  id: string;
  type: "html";
  html: string;
};

export type CalloutBlock = {
  id: string;
  type: "callout";
  text: string;
  tone?: "muted" | "accent" | "warn";
};

export type VideoBlock = {
  id: string;
  type: "video";
  url: string;
  title?: string;
};

export type EmbedBlock = {
  id: string;
  type: "embed";
  url: string;
  aspect?: "16-9" | "4-3" | "1-1";
};

export type FeatureBlock = {
  id: string;
  type: "feature";
  title: string;
  body: string;
  align?: TextAlign;
};

export type SocialLinkItem = {
  label: string;
  href: string;
};

export type SocialLinksBlock = {
  id: string;
  type: "social-links";
  items: SocialLinkItem[];
};

// ── New block sub-types ──────────────────────────────────────────────────────

export type StatItem = {
  value: string;
  label: string;
};

export type GalleryImage = {
  mediaKey?: string;
  src?: string;
  alt?: string;
};

export type LogoItem = {
  mediaKey?: string;
  src?: string;
  alt?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type StepItem = {
  title: string;
  body: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

// ── New block types ──────────────────────────────────────────────────────────

/** Landing page hero: large heading + subtext + optional CTA. */
export type HeroBlock = {
  id: string;
  type: "hero";
  heading: string;
  subtext?: string;
  buttonLabel?: string;
  buttonHref?: string;
  align?: TextAlign;
  background?: "none" | "muted" | "accent-soft";
};

/** Row of stat pairs, e.g. "12k users · 99% uptime". */
export type StatsBlock = {
  id: string;
  type: "stats";
  items: StatItem[];
  align?: TextAlign;
};

/** 2–4 column image grid. */
export type GalleryBlock = {
  id: string;
  type: "gallery";
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  radius?: "none" | "md" | "lg";
};

/** Horizontal strip of logo images. */
export type LogoStripBlock = {
  id: string;
  type: "logo-strip";
  logos: LogoItem[];
  label?: string;
};

/** Accordion-style question + answer list. */
export type FaqBlock = {
  id: string;
  type: "faq";
  items: FaqItem[];
};

/** Numbered vertical steps. */
export type StepsBlock = {
  id: string;
  type: "steps";
  items: StepItem[];
};

/** Single pricing tier card. */
export type PricingCardBlock = {
  id: string;
  type: "pricing-card";
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  buttonLabel?: string;
  buttonHref?: string;
  highlighted?: boolean;
};

/** Quote with avatar and attribution. */
export type TestimonialBlock = {
  id: string;
  type: "testimonial";
  quote: string;
  name: string;
  role?: string;
  avatarSrc?: string;
  avatarMediaKey?: string;
};

/** Full-width alert strip with optional dismiss. */
export type AlertBannerBlock = {
  id: string;
  type: "alert-banner";
  text: string;
  tone?: "info" | "warn" | "success";
  dismissible?: boolean;
};

/** Linear breadcrumb trail. */
export type BreadcrumbBlock = {
  id: string;
  type: "breadcrumb";
  items: BreadcrumbItem[];
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | QuoteBlock
  | ListBlock
  | LinkBlock
  | NavLinksBlock
  | SectionBlock
  | ColumnsBlock
  | FormBlock
  | BadgeBlock
  | CalloutBlock
  | VideoBlock
  | EmbedBlock
  | FeatureBlock
  | SocialLinksBlock
  | HeroBlock
  | StatsBlock
  | GalleryBlock
  | LogoStripBlock
  | FaqBlock
  | StepsBlock
  | PricingCardBlock
  | TestimonialBlock
  | AlertBannerBlock
  | BreadcrumbBlock
  | HtmlBlock;

export type PageDocument = {
  version: 1;
  blocks: Block[];
};

/** Alias used once posts/products share the same shape. */
export type BlockDocument = PageDocument;

export const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "image",
  "button",
  "quote",
  "list",
  "link",
  "nav-links",
  "divider",
  "spacer",
  "section",
  "columns",
  "form",
  "badge",
  "callout",
  "video",
  "embed",
  "feature",
  "social-links",
  "hero",
  "stats",
  "gallery",
  "logo-strip",
  "faq",
  "steps",
  "pricing-card",
  "testimonial",
  "alert-banner",
  "breadcrumb",
  "html",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const LEAF_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "image",
  "button",
  "quote",
  "list",
  "link",
  "nav-links",
  "divider",
  "spacer",
  "form",
  "badge",
  "callout",
  "video",
  "embed",
  "feature",
  "social-links",
  "hero",
  "stats",
  "gallery",
  "logo-strip",
  "faq",
  "steps",
  "pricing-card",
  "testimonial",
  "alert-banner",
  "breadcrumb",
  "html",
] as const;

export function newFieldId(): string {
  return `fld_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function defaultFormFields(): FormField[] {
  return [
    { id: newFieldId(), name: "name", label: "Name", kind: "text", required: true },
    { id: newFieldId(), name: "email", label: "Email", kind: "email", required: true },
    { id: newFieldId(), name: "message", label: "Message", kind: "textarea", required: true },
  ];
}

export function defaultSocialItems(): SocialLinkItem[] {
  return [
    { label: "X", href: "https://x.com" },
    { label: "GitHub", href: "https://github.com" },
  ];
}

export function emptyDocument(): PageDocument {
  return { version: 1, blocks: [] };
}

export function newBlockId(): string {
  return `blk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "Heading", align: "left", size: "md" };
    case "paragraph":
      return { id, type, text: "Write something.", align: "left", size: "md" };
    case "image":
      return { id, type, alt: "", src: "", width: "content", radius: "md" };
    case "button":
      return { id, type, label: "Click me", href: "#", align: "left", variant: "solid" };
    case "quote":
      return { id, type, text: "A short quote.", cite: "", align: "left" };
    case "list":
      return { id, type, style: "ul", items: ["First item", "Second item"] };
    case "link":
      return { id, type, label: "Link", href: "/" };
    case "nav-links":
      return { id, type, max: 6 };
    case "divider":
      return { id, type };
    case "spacer":
      return { id, type, size: "md" };
    case "section":
      return {
        id,
        type,
        pad: "md",
        width: "content",
        background: "none",
        blocks: [createBlock("paragraph")],
      };
    case "columns":
      return {
        id,
        type,
        gap: "md",
        ratio: "1-1",
        columns: [[createBlock("paragraph")], [createBlock("paragraph")]],
      };
    case "form":
      return {
        id,
        type,
        title: "Contact",
        submitLabel: "Send",
        successMessage: "Got it. We will read this.",
        fields: defaultFormFields(),
      };
    case "badge":
      return { id, type, text: "New", tone: "accent" };
    case "callout":
      return { id, type, text: "A short note visitors should not miss.", tone: "muted" };
    case "video":
      return { id, type, url: "", title: "Video" };
    case "embed":
      return { id, type, url: "", aspect: "16-9" };
    case "feature":
      return {
        id,
        type,
        title: "Feature",
        body: "One clear benefit. Keep it short.",
        align: "left",
      };
    case "social-links":
      return { id, type, items: defaultSocialItems() };
    case "hero":
      return {
        id,
        type,
        heading: "Welcome",
        subtext: "A short description of what you do.",
        buttonLabel: "Get started",
        buttonHref: "#",
        align: "center",
        background: "none",
      };
    case "stats":
      return {
        id,
        type,
        items: [
          { value: "10k+", label: "Users" },
          { value: "99%", label: "Uptime" },
          { value: "24h", label: "Support" },
        ],
        align: "center",
      };
    case "gallery":
      return {
        id,
        type,
        images: [
          { src: "", alt: "" },
          { src: "", alt: "" },
          { src: "", alt: "" },
        ],
        columns: 3,
        radius: "md",
      };
    case "logo-strip":
      return {
        id,
        type,
        logos: [
          { src: "", alt: "Company" },
          { src: "", alt: "Company" },
          { src: "", alt: "Company" },
        ],
        label: "Trusted by",
      };
    case "faq":
      return {
        id,
        type,
        items: [
          { question: "What is this?", answer: "A short answer." },
          { question: "How does it work?", answer: "Another short answer." },
        ],
      };
    case "steps":
      return {
        id,
        type,
        items: [
          { title: "Step one", body: "Do the first thing." },
          { title: "Step two", body: "Then do this." },
          { title: "Step three", body: "And finally this." },
        ],
      };
    case "pricing-card":
      return {
        id,
        type,
        name: "Pro",
        price: "$12",
        period: "/ month",
        description: "For teams that need more.",
        features: ["Feature one", "Feature two", "Feature three"],
        buttonLabel: "Get started",
        buttonHref: "#",
        highlighted: false,
      };
    case "testimonial":
      return {
        id,
        type,
        quote: "This product changed how we work.",
        name: "Alex Johnson",
        role: "CEO, Acme Inc.",
        avatarSrc: "",
      };
    case "alert-banner":
      return {
        id,
        type,
        text: "We have an update for you.",
        tone: "info",
        dismissible: true,
      };
    case "breadcrumb":
      return {
        id,
        type,
        items: [
          { label: "Home", href: "/" },
          { label: "Docs", href: "/docs" },
          { label: "This page" },
        ],
      };
    case "html":
      return {
        id,
        type,
        html: "<div>\n  <p>Custom HTML</p>\n</div>",
      };
  }
}

import { richTextToPlain } from "./rich-text";

function plainFromBlocks(blocks: Block[], parts: string[]) {
  for (const b of blocks) {
    if (b.type === "html") {
      const t = b.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
    } else if (b.type === "heading" || b.type === "paragraph" || b.type === "quote" || b.type === "callout" || b.type === "badge") {
      const t = richTextToPlain(b.text).trim();
      if (t) parts.push(t);
    } else if (b.type === "feature") {
      const title = richTextToPlain(b.title).trim();
      const body = richTextToPlain(b.body).trim();
      if (title) parts.push(title);
      if (body) parts.push(body);
    } else if (b.type === "button" || b.type === "link") {
      const t = richTextToPlain(b.label).trim();
      if (t) parts.push(t);
    } else if (b.type === "image") {
      if (b.alt?.trim()) parts.push(b.alt.trim());
      if (b.caption?.trim()) parts.push(b.caption.trim());
    } else if (b.type === "list") {
      for (const item of b.items) {
        const t = richTextToPlain(item).trim();
        if (t) parts.push(t);
      }
    } else if (b.type === "social-links") {
      for (const item of b.items) {
        if (item.label.trim()) parts.push(item.label.trim());
      }
    } else if (b.type === "video" && b.title?.trim()) {
      parts.push(b.title.trim());
    } else if (b.type === "form") {
      const t = (b.title || "").trim();
      if (t) parts.push(t);
      for (const f of b.fields) {
        const label = f.label.trim();
        if (label) parts.push(label);
      }
    } else if (b.type === "section") {
      plainFromBlocks(b.blocks, parts);
    } else if (b.type === "columns") {
      plainFromBlocks(b.columns[0], parts);
      plainFromBlocks(b.columns[1], parts);
    } else if (b.type === "hero") {
      if (b.heading?.trim()) parts.push(b.heading.trim());
      if (b.subtext?.trim()) parts.push(b.subtext.trim());
    } else if (b.type === "stats") {
      for (const item of b.items) {
        if (item.value?.trim()) parts.push(`${item.value.trim()} ${item.label.trim()}`);
      }
    } else if (b.type === "faq") {
      for (const item of b.items) {
        if (item.question?.trim()) parts.push(item.question.trim());
        if (item.answer?.trim()) parts.push(item.answer.trim());
      }
    } else if (b.type === "steps") {
      for (const item of b.items) {
        if (item.title?.trim()) parts.push(item.title.trim());
        if (item.body?.trim()) parts.push(item.body.trim());
      }
    } else if (b.type === "pricing-card") {
      if (b.name?.trim()) parts.push(b.name.trim());
      if (b.description?.trim()) parts.push(b.description.trim());
      for (const f of b.features) {
        if (f?.trim()) parts.push(f.trim());
      }
    } else if (b.type === "testimonial") {
      if (b.quote?.trim()) parts.push(b.quote.trim());
      if (b.name?.trim()) parts.push(b.name.trim());
    } else if (b.type === "alert-banner") {
      if (b.text?.trim()) parts.push(b.text.trim());
    } else if (b.type === "breadcrumb") {
      for (const item of b.items) {
        if (item.label?.trim()) parts.push(item.label.trim());
      }
    }
  }
}

/** Plain-text fallback for SEO / legacy body column. */
export function documentToPlainText(doc: PageDocument): string {
  const parts: string[] = [];
  plainFromBlocks(doc.blocks, parts);
  return parts.join("\n\n");
}

export function countBlocks(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    n += 1;
    if (b.type === "section") n += countBlocks(b.blocks);
    if (b.type === "columns") {
      n += countBlocks(b.columns[0]);
      n += countBlocks(b.columns[1]);
    }
  }
  return n;
}

export function findBlock(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.type === "section") {
      const found = findBlock(b.blocks, id);
      if (found) return found;
    }
    if (b.type === "columns") {
      const a = findBlock(b.columns[0], id);
      if (a) return a;
      const c = findBlock(b.columns[1], id);
      if (c) return c;
    }
  }
  return null;
}

export function mapBlocks(blocks: Block[], fn: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    const next = fn(b);
    if (next.type === "section") {
      return { ...next, blocks: mapBlocks(next.blocks, fn) };
    }
    if (next.type === "columns") {
      return {
        ...next,
        columns: [mapBlocks(next.columns[0], fn), mapBlocks(next.columns[1], fn)],
      };
    }
    return next;
  });
}

/** Replace a block by id anywhere in the tree. */
export function replaceBlock(blocks: Block[], next: Block): Block[] {
  return blocks.map((b) => {
    if (b.id === next.id) return next;
    if (b.type === "section") {
      return { ...b, blocks: replaceBlock(b.blocks, next) };
    }
    if (b.type === "columns") {
      return {
        ...b,
        columns: [replaceBlock(b.columns[0], next), replaceBlock(b.columns[1], next)],
      };
    }
    return b;
  });
}

export function removeBlock(blocks: Block[], id: string): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.id === id) continue;
    if (b.type === "section") {
      out.push({ ...b, blocks: removeBlock(b.blocks, id) });
    } else if (b.type === "columns") {
      out.push({
        ...b,
        columns: [removeBlock(b.columns[0], id), removeBlock(b.columns[1], id)],
      });
    } else {
      out.push(b);
    }
  }
  return out;
}

/** Move dragId next to targetId within the same sibling list. */
export function reorderSiblings(
  blocks: Block[],
  dragId: string,
  targetId: string,
  place: "before" | "after",
): Block[] {
  if (dragId === targetId) return blocks;

  const dragIdx = blocks.findIndex((b) => b.id === dragId);
  const targetIdx = blocks.findIndex((b) => b.id === targetId);
  if (dragIdx >= 0 && targetIdx >= 0) {
    const copy = [...blocks];
    const [item] = copy.splice(dragIdx, 1);
    if (!item) return blocks;
    let insertAt = copy.findIndex((b) => b.id === targetId);
    if (insertAt < 0) return blocks;
    if (place === "after") insertAt += 1;
    copy.splice(insertAt, 0, item);
    return copy;
  }

  return blocks.map((b) => {
    if (b.type === "section") {
      return { ...b, blocks: reorderSiblings(b.blocks, dragId, targetId, place) };
    }
    if (b.type === "columns") {
      return {
        ...b,
        columns: [
          reorderSiblings(b.columns[0], dragId, targetId, place),
          reorderSiblings(b.columns[1], dragId, targetId, place),
        ],
      };
    }
    return b;
  });
}

/** Move a top-level sibling (same parent list) by finding parent of id. */
export function moveBlockInTree(blocks: Block[], id: string, dir: -1 | 1): Block[] {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx >= 0) {
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return blocks;
    const copy = [...blocks];
    const tmp = copy[idx]!;
    copy[idx] = copy[next]!;
    copy[next] = tmp;
    return copy;
  }
  return blocks.map((b) => {
    if (b.type === "section") {
      return { ...b, blocks: moveBlockInTree(b.blocks, id, dir) };
    }
    if (b.type === "columns") {
      return {
        ...b,
        columns: [
          moveBlockInTree(b.columns[0], id, dir),
          moveBlockInTree(b.columns[1], id, dir),
        ],
      };
    }
    return b;
  });
}

/** Insert after selected id, or into empty section/column if selected is container. */
export function insertAfter(blocks: Block[], selectedId: string | null, block: Block): Block[] {
  if (!selectedId) return [...blocks, block];

  const selected = findBlock(blocks, selectedId);
  if (selected?.type === "section") {
    return replaceBlock(blocks, {
      ...selected,
      blocks: [...selected.blocks, block],
    });
  }
  if (selected?.type === "columns") {
    return replaceBlock(blocks, {
      ...selected,
      columns: [[...selected.columns[0], block], selected.columns[1]],
    });
  }

  function walk(list: Block[]): Block[] | null {
    const idx = list.findIndex((b) => b.id === selectedId);
    if (idx >= 0) {
      const copy = [...list];
      copy.splice(idx + 1, 0, block);
      return copy;
    }
    for (let i = 0; i < list.length; i++) {
      const b = list[i]!;
      if (b.type === "section") {
        const inner = walk(b.blocks);
        if (inner) {
          const copy = [...list];
          copy[i] = { ...b, blocks: inner };
          return copy;
        }
      }
      if (b.type === "columns") {
        const left = walk(b.columns[0]);
        if (left) {
          const copy = [...list];
          copy[i] = { ...b, columns: [left, b.columns[1]] };
          return copy;
        }
        const right = walk(b.columns[1]);
        if (right) {
          const copy = [...list];
          copy[i] = { ...b, columns: [b.columns[0], right] };
          return copy;
        }
      }
    }
    return null;
  }

  return walk(blocks) ?? [...blocks, block];
}
