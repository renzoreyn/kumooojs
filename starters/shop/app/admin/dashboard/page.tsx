"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@kumooo/ui";
import { Masthead } from "../../../components/masthead";
import { ImageUpload } from "../../../components/image-upload";
import { getShopDemoToken, shopApi, type Product } from "../../../lib/api";

function sizesToText(sizes: string[]) {
  return sizes.join(", ");
}

function colorsToText(colors: Product["colors"]) {
  return colors.map((c) => `${c.name} ${c.hex}`).join("\n");
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [blurb, setBlurb] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [sizesText, setSizesText] = React.useState("S, M, L, XL");
  const [colorsText, setColorsText] = React.useState("Black #111111\nIce #c8d6ef");
  const [status, setStatus] = React.useState<"published" | "draft">("published");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const p = await shopApi.adminProducts();
    setProducts(p.products);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await shopApi.me();
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
    setName("");
    setSlug("");
    setPrice("");
    setBlurb("");
    setDescription("");
    setImageUrl("");
    setSizesText("S, M, L, XL");
    setColorsText("Black #111111\nIce #c8d6ef");
    setStatus("published");
    setMsg(null);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setSlug(p.slug);
    setPrice(p.price);
    setBlurb(p.blurb);
    setDescription(p.description || "");
    setImageUrl(p.imageUrl || "");
    setSizesText(sizesToText(p.sizes));
    setColorsText(colorsToText(p.colors));
    setStatus(p.status === "draft" ? "draft" : "published");
    setMsg(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const payload = {
        name,
        slug: slug || undefined,
        price,
        blurb,
        description,
        imageUrl: imageUrl || undefined,
        sizesText,
        colorsText,
        status,
      };
      if (editing) {
        await shopApi.updateProduct(editing.id, payload);
      } else {
        await shopApi.createProduct(payload);
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

  async function removeProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await shopApi.deleteProduct(id);
    await load();
  }

  async function logout() {
    await shopApi.logout();
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
            <h1 className="skin-heading text-3xl">Products</h1>
            <p className="mt-1 text-sm text-[var(--fog)]">
              Name, price, sizes, colors, description, image URL. Full product pages on the storefront.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={logout} className="skin-btn border-0">
              Log out
            </Button>
            <Link href="/" className="skin-btn inline-flex items-center px-3 text-xs font-bold no-underline">
              View shop
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <form onSubmit={save} className="skin-card space-y-3 p-5">
            <p className="font-display text-sm font-bold uppercase">
              {editing ? "Edit product" : "New product"}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$120" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blurb">Short blurb</Label>
              <Input id="blurb" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="min-h-28 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full product details…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sizes">Sizes</Label>
              <Input
                id="sizes"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder="XS, S, M, L, XL"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colors">Colors (one per line: Name #hex)</Label>
              <textarea
                id="colors"
                className="min-h-20 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 font-mono text-sm"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
                placeholder={"Black #111111\nIce #c8d6ef"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://… or upload below"
              />
            </div>
            <ImageUpload
              scope="shop"
              getToken={getShopDemoToken}
              onUploaded={(url) => setImageUrl(url)}
              label="Or upload"
            />
            {imageUrl ? (
              <div className="overflow-hidden rounded-[var(--skin-radius-sm,8px)] border border-[var(--ink)]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="max-h-40 w-full object-cover" />
              </div>
            ) : null}
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
            {products.map((p) => (
              <li key={p.id} className="skin-card overflow-hidden p-0">
                <div className="flex gap-3 p-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[var(--skin-radius-sm,8px)] bg-[var(--paper)]">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="skin-heading text-lg">{p.name}</p>
                    <p className="text-xs text-[var(--fog)]">
                      /{p.slug} · {p.price} · {p.status}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--fog)]">
                      {p.sizes.join(" · ") || "no sizes"}
                      {p.colors.length ? ` · ${p.colors.map((c) => c.name).join(", ")}` : ""}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={`/products/${p.slug}`}
                        className="skin-btn px-2 py-1 text-[10px] font-bold no-underline"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="skin-btn px-2 py-1 text-[10px] font-bold"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="skin-btn bg-[var(--hot)] px-2 py-1 text-[10px] font-bold"
                        onClick={() => removeProduct(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {products.length === 0 ? <li className="text-sm text-[var(--fog)]">No products.</li> : null}
          </ul>
        </div>
      </main>
    </>
  );
}
