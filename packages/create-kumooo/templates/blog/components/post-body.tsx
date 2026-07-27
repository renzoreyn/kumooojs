"use client";

import ReactMarkdown from "react-markdown";

function safeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const u = new URL(href, "https://example.invalid");
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") return href;
  } catch {
    /* ignore */
  }
  return undefined;
}

function safeImgSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  try {
    const u = new URL(src);
    if (u.protocol === "http:" || u.protocol === "https:") return src;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Renders post body Markdown (not full MDX - no JSX/components). */
export function PostBody({ source }: { source: string }) {
  return (
    <div className="post-md text-lg leading-relaxed text-[var(--ink)]">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2 className="skin-heading mt-8 mb-3 text-2xl first:mt-0">{children}</h2>,
          h2: ({ children }) => <h3 className="skin-heading mt-7 mb-2 text-xl first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="mt-6 mb-2 text-lg font-semibold first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="my-4 text-[var(--fog)] first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-[var(--ink)]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-1 pl-5 text-[var(--fog)]">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-1 pl-5 text-[var(--fog)]">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-[var(--cyan)] pl-4 text-[var(--fog)] italic">{children}</blockquote>
          ),
          code: ({ className, children }) => {
            const block = Boolean(className);
            if (block) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--ink)]">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--hot)]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-4 overflow-x-auto">{children}</pre>,
          a: ({ href, children }) => {
            const safe = safeHref(href);
            if (!safe) return <span>{children}</span>;
            return (
              <a
                href={safe}
                className="font-medium text-[var(--hot)] underline underline-offset-2"
                rel="noopener noreferrer"
                target={safe.startsWith("http") ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const safe = safeImgSrc(typeof src === "string" ? src : undefined);
            if (!safe) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safe}
                alt={alt || ""}
                className="my-6 h-auto max-w-full rounded-[var(--skin-radius,12px)] border border-[var(--ink)]/10"
                loading="lazy"
              />
            );
          },
          hr: () => <hr className="skin-rule my-8" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
