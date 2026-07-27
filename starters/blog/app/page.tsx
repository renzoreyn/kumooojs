"use client";

import * as React from "react";
import Link from "next/link";
import { FadeIn, Stagger } from "@kumooo/ui";
import { Masthead } from "../components/masthead";
import { blogApi, type Post } from "../lib/api";

export default function BlogHome() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await blogApi.listPosts();
        if (!cancelled) setPosts(data.posts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Masthead />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <FadeIn>
          <p className="skin-badge mb-4">Blog</p>
          <h1 className="font-display skin-title text-5xl leading-[0.95] sm:text-7xl">
            Stories
            <span className="text-[var(--hot)]">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-[var(--fog)]">
            Sample posts for the demo. Publish from admin; guests can comment. Demo data resets daily at 00:00 UTC.
          </p>
        </FadeIn>

        {loading ? <p className="mt-12 font-display text-sm">Loading feed...</p> : null}
        {error ? (
          <p className="mt-12 border-2 border-[var(--ink)] bg-[var(--hot)] px-4 py-3 text-sm font-bold text-black">
            Could not load posts ({error}). Is the API up?
          </p>
        ) : null}

        <Stagger className="mt-12 grid gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`} className="skin-card block p-5 no-underline transition-transform hover:-translate-y-0.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="skin-badge">{(post.publishedAt || post.createdAt).slice(0, 10)}</span>
                <span className="font-display text-[11px] font-bold tracking-[0.16em] text-[var(--cyan)] uppercase">
                  Feature
                </span>
              </div>
              <h2 className="skin-heading mt-3 text-2xl text-[var(--ink)] sm:text-3xl">
                {post.title}
              </h2>
              <p className="skin-muted mt-2 text-base leading-relaxed">{post.excerpt}</p>
              <p className="mt-4 font-display text-xs font-bold tracking-wider text-[var(--cyan)] uppercase">
                Read story →
              </p>
            </Link>
          ))}
        </Stagger>
      </main>
    </>
  );
}
