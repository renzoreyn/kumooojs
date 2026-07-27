"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@kumooo/ui";
import { Masthead } from "../../components/masthead";
import { blogApi } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    blogApi
      .me()
      .then(() => router.replace("/admin/dashboard"))
      .catch(() => {});
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await blogApi.login(username, password);
      router.replace("/admin/dashboard");
    } catch {
      setError("Wrong username or password. Use admin / admin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Masthead admin />
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="skin-card p-6">
          <p className="skin-badge">Admin</p>
          <h1 className="font-display mt-4 text-3xl font-black tracking-tight">Blog admin</h1>
          <p className="mt-2 text-sm text-[var(--fog)]">
            Demo login: <strong className="text-[var(--hot)]">admin</strong> /{" "}
            <strong className="text-[var(--hot)]">admin</strong>
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user">Username</Label>
              <Input id="user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass">Password</Label>
              <Input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="text-sm font-bold text-[var(--hot)]">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full skin-btn border-0">
              {busy ? "..." : "Enter"}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
