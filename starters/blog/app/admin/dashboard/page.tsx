"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@kumooo/ui";
import { Masthead } from "../../../components/masthead";
import { FormattingGuide } from "../../../components/formatting-guide";
import { ImageUpload } from "../../../components/image-upload";
import { blogApi, getBlogDemoToken, type AdminComment, type Post } from "../../../lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [tab, setTab] = React.useState<"posts" | "comments">("posts");
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [comments, setComments] = React.useState<AdminComment[]>([]);
  const [editing, setEditing] = React.useState<Post | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [body, setBody] = React.useState("");
  const [status, setStatus] = React.useState<"published" | "draft">("published");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [p, c] = await Promise.all([blogApi.adminPosts(), blogApi.adminComments()]);
    setPosts(p.posts);
    setComments(c.comments);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await blogApi.me();
        await load();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) router.replace("/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, router]);

  function startNew() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBody("");
    setStatus("published");
    setMsg(null);
  }

  function startEdit(p: Post) {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt);
    setBody(p.body);
    setStatus(p.status === "draft" ? "draft" : "published");
    setMsg(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (editing) {
        await blogApi.updatePost(editing.id, { title, slug, excerpt, body, status });
      } else {
        await blogApi.createPost({ title, slug: slug || undefined, excerpt, body, status });
      }
      await load();
      startNew();
      setMsg("Saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await blogApi.deletePost(id);
    await load();
  }

  async function removeComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    await blogApi.deleteComment(id);
    await load();
  }

  async function logout() {
    await blogApi.logout();
    router.replace("/admin");
  }

  if (!ready) {
    return (
      <>
        <Masthead admin />
        <main className="grid min-h-[50vh] place-items-center font-display text-sm">Loading admin...</main>
      </>
    );
  }

  return (
    <>
      <Masthead admin />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--fog)]">Create, edit, and delete posts. Moderate comments.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={logout} className="skin-btn border-0">
              Log out
            </Button>
            <Link href="/" className="skin-btn inline-flex items-center px-3 text-xs font-bold no-underline">
              View site
            </Link>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            className={`skin-btn px-4 py-2 text-xs font-bold ${tab === "posts" ? "bg-[var(--hot)]" : ""}`}
            onClick={() => setTab("posts")}
          >
            Posts
          </button>
          <button
            type="button"
            className={`skin-btn px-4 py-2 text-xs font-bold ${tab === "comments" ? "bg-[var(--cyan)]" : ""}`}
            onClick={() => setTab("comments")}
          >
            Comments ({comments.length})
          </button>
        </div>

        {tab === "posts" ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <form onSubmit={save} className="skin-card space-y-3 p-5">
              <p className="font-display text-sm font-bold uppercase">
                {editing ? "Edit post" : "New post"}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">Body (Markdown)</Label>
                <textarea
                  id="body"
                  className="min-h-40 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 font-mono text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder={"## Hello\n\nWrite **Markdown** here.\n\n![optional](https://…)"}
                />
              </div>
              <ImageUpload
                scope="blog"
                getToken={getBlogDemoToken}
                label="Insert image"
                onUploaded={(url) => {
                  const md = `![image](${url})`;
                  setBody((prev) => (prev.trim() ? `${prev.trimEnd()}\n\n${md}\n` : `${md}\n`));
                }}
              />
              <FormattingGuide />
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              {msg ? <p className="text-sm font-bold">{msg}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy} className="skin-btn border-0">
                  {busy ? "Saving..." : "Save"}
                </Button>
                {editing ? (
                  <Button type="button" variant="outline" onClick={startNew} className="skin-btn border-0">
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>

            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="skin-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-bold">{p.title}</p>
                      <p className="text-xs text-[var(--fog)]">
                        /{p.slug} · {p.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="skin-btn px-2 py-1 text-[10px] font-bold" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="skin-btn bg-[var(--hot)] px-2 py-1 text-[10px] font-bold"
                        onClick={() => removePost(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="skin-card p-4">
                <p className="font-display text-xs font-bold text-[var(--hot)] uppercase">
                  {c.authorName} · {c.authorEmail}
                </p>
                <p className="mt-1 text-xs text-[var(--fog)]">on {c.postTitle}</p>
                <p className="mt-2 text-sm">{c.body}</p>
                <button
                  type="button"
                  className="skin-btn mt-3 bg-[var(--hot)] px-2 py-1 text-[10px] font-bold"
                  onClick={() => removeComment(c.id)}
                >
                  Delete
                </button>
              </li>
            ))}
            {comments.length === 0 ? <li className="text-sm text-[var(--fog)]">No comments.</li> : null}
          </ul>
        )}
      </main>
    </>
  );
}
