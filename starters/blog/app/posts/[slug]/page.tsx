"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Label } from "@kumooo/ui";
import { Masthead } from "../../../components/masthead";
import { PostBody } from "../../../components/post-body";
import { blogApi, type Post, type PublicComment } from "../../../lib/api";

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = React.useState<string | null>(null);
  const [post, setPost] = React.useState<Post | null>(null);
  const [comments, setComments] = React.useState<PublicComment[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { slug: s } = await params;
      if (cancelled) return;
      setSlug(s);
      try {
        const [{ post: p }, { comments: c }] = await Promise.all([
          blogApi.getPost(s),
          blogApi.listComments(s),
        ]);
        if (cancelled) return;
        setPost(p);
        setComments(c);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function onComment(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await blogApi.addComment(slug, { name, email, body });
      setComments((prev) => [...prev, res.comment]);
      setBody("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Masthead />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link href="/" className="skin-btn inline-block px-3 py-1.5 text-xs font-bold no-underline">
          ← Back
        </Link>
        {error ? (
          <p className="mt-8 border-2 border-[var(--ink)] bg-[var(--hot)] p-4 font-bold text-black">{error}</p>
        ) : null}
        {post ? (
          <article className="mt-8">
            <span className="skin-badge">{(post.publishedAt || post.createdAt).slice(0, 10)}</span>
            <h1 className="skin-heading mt-4 text-4xl sm:text-5xl">{post.title}</h1>
            <div className="mt-8">
              <PostBody source={post.body} />
            </div>
          </article>
        ) : !error ? (
          <p className="mt-8 font-display text-sm">Loading...</p>
        ) : null}

        {post ? (
          <section className="skin-rule mt-14 pt-10">
            <h2 className="font-display text-xl font-black tracking-wide uppercase">Comments</h2>
            <ul className="mt-6 space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="skin-card p-4">
                  <p className="font-display text-xs font-bold tracking-wider text-[var(--hot)] uppercase">
                    {c.authorName}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
                </li>
              ))}
              {comments.length === 0 ? (
                <li className="text-sm text-[var(--fog)]">No comments yet.</li>
              ) : null}
            </ul>

            <form onSubmit={onComment} className="skin-card mt-8 space-y-4 p-5">
              <p className="font-display text-sm font-bold uppercase">Leave a comment</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">Comment</Label>
                <textarea
                  id="body"
                  className="flex min-h-24 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>
              {formError ? <p className="text-sm font-bold text-[var(--hot)]">{formError}</p> : null}
              <Button type="submit" disabled={busy} className="skin-btn border-0">
                {busy ? "Sending..." : "Post comment"}
              </Button>
            </form>
          </section>
        ) : null}
      </main>
    </>
  );
}
