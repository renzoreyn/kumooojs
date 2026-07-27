import { FadeIn } from "@kumooo/ui";
import { CopyCommand } from "../components/copy-command";
import { KitPlayground } from "../components/kit-playground";

export default function HomePage() {
  return (
    <>
      <main className="relative z-10">
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-20">
          <FadeIn className="max-w-2xl">
            <h1 className="font-display text-5xl font-semibold tracking-[-0.045em] text-[hsl(var(--foreground))] sm:text-6xl md:text-7xl">
              Blank starter.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-xl">
              A nearly empty App Router page with @kumooo/ui. Replace this copy and build from here.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CopyCommand />
              <a
                href="https://docs.kumooo.dev/docs/setup"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 text-sm font-medium text-[hsl(var(--foreground))] no-underline transition-colors hover:bg-[hsl(var(--accent))]"
              >
                Guided setup
              </a>
            </div>
          </FadeIn>
        </section>

        <KitPlayground />
      </main>

      <footer className="relative z-10 border-t border-[hsl(var(--border))]/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-10 text-sm text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            Start with{" "}
            <code className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-[13px] text-[hsl(var(--foreground))]">
              npx create-kumooo
            </code>
          </p>
          <div className="flex gap-4">
            <a href="https://kumooo.dev" className="text-[hsl(var(--foreground))] no-underline hover:underline">
              kumooo.dev
            </a>
            <a href="https://docs.kumooo.dev" className="text-[hsl(var(--foreground))] no-underline hover:underline">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
