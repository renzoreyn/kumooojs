"use client";

import * as React from "react";
import { Dropzone, Label } from "@kumooo/ui";

const API =
  process.env.NEXT_PUBLIC_KUMOOO_API_URL?.replace(/\/$/, "") || "https://api.kumooo.dev";

type Props = {
  scope: "shop" | "blog";
  getToken: () => string | null;
  onUploaded: (url: string) => void;
  label?: string;
};

export function ImageUpload({ scope, getToken, onUploaded, label = "Upload image" }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function upload(files: FileList) {
    const file = files[0];
    if (!file) return;
    const token = getToken();
    if (!token) {
      setError("Sign in to admin first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("scope", scope);
      const res = await fetch(`${API}/demo/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || `http_${res.status}`);
      onUploaded(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Dropzone
        accept="image/jpeg,image/png,image/webp,image/gif"
        label={busy ? "Uploading…" : "Drop image or click (max 2MB)"}
        className="rounded-[var(--skin-radius,12px)] border-[var(--ink)]/25 bg-[var(--surface)] py-6 text-[var(--fog)]"
        onFiles={(files) => {
          if (!busy) void upload(files);
        }}
      />
      {error ? <p className="text-xs font-bold text-[var(--hot)]">{error}</p> : null}
    </div>
  );
}
