"use client";

import * as React from "react";

export function FormattingGuide() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="skin-card overflow-hidden p-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--ink)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Markdown formatting guide</span>
        <span className="text-[var(--fog)]">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[var(--ink)]/10 px-4 py-3 text-xs leading-relaxed text-[var(--fog)]">
          <p>
            Body text is <strong className="text-[var(--ink)]">Markdown</strong> (not full MDX - no JSX). It renders on
            the public post page.
          </p>
          <ul className="space-y-1.5 font-mono text-[11px] text-[var(--ink)]">
            <li>**bold** · *italic* · `code`</li>
            <li>## Heading · ### Smaller</li>
            <li>- bullet list · 1. numbered</li>
            <li>[link text](https://example.com)</li>
            <li>&gt; quote</li>
            <li>--- horizontal rule</li>
          </ul>
          <div className="rounded-lg bg-[var(--surface)] p-3">
            <p className="mb-1.5 font-semibold text-[var(--ink)]">Images</p>
            <p className="mb-2">
              Use <strong className="text-[var(--ink)]">Insert image</strong> above to upload (JPEG/PNG/WebP/GIF, max
              2MB), or paste a public URL:
            </p>
            <code className="block break-all font-mono text-[11px] text-[var(--hot)]">
              ![Alt text](https://example.com/photo.jpg)
            </code>
            <p className="mt-2">Demo uploads reset nightly with the rest of the sandbox.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
