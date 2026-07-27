import { cn } from "../lib/cn";

/** Simple code block surface (Kibo-adjacent pattern for docs/demos). */
export function CodeBlock({
  className,
  code,
  language = "tsx",
}: {
  className?: string;
  code: string;
  language?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span>{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
