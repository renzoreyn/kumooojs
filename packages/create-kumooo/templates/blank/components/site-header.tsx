import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-[hsl(var(--border))]/80 bg-[hsl(var(--background))]/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <a
          href="https://kumooo.dev"
          className="inline-flex items-center gap-2.5 text-[hsl(var(--foreground))] no-underline"
        >
          <BrandMark className="h-7 w-7" />
          <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">
            kumooo<span className="text-[var(--mint)]">.js</span>
          </span>
          <span className="ml-1 text-xs font-medium tracking-[0.16em] text-[var(--mint)] uppercase">Blank</span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="https://docs.kumooo.dev"
            className="hidden text-sm text-[hsl(var(--muted-foreground))] no-underline transition-colors hover:text-[hsl(var(--foreground))] sm:inline"
          >
            Docs
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
