"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@kumooo/ui";
import { BagButton, useBag } from "../../../components/bag";
import { Masthead } from "../../../components/masthead";
import { shopApi, type Product } from "../../../lib/api";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { add } = useBag();
  const [slug, setSlug] = React.useState<string | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [size, setSize] = React.useState<string | null>(null);
  const [color, setColor] = React.useState<string | null>(null);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { slug: s } = await params;
      if (cancelled) return;
      setSlug(s);
      try {
        const { product: p } = await shopApi.getProduct(s);
        if (cancelled) return;
        setProduct(p);
        setSize(p.sizes[0] ?? null);
        setColor(p.colors[0]?.name ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  function onAdd() {
    if (!product) return;
    if (product.sizes.length && !size) return;
    if (product.colors.length && !color) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size,
      color,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <>
      <Masthead bagSlot={<BagButton />} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="skin-btn inline-block px-3 py-1.5 text-xs font-bold no-underline">
          ← Catalog
        </Link>

        {error ? (
          <p className="mt-8 border-2 border-[var(--ink)] bg-[var(--hot)] p-4 font-bold text-black">{error}</p>
        ) : null}

        {!product && !error ? <p className="mt-10 font-display text-sm">Loading...</p> : null}

        {product ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="skin-card overflow-hidden p-0">
              <div className="aspect-[4/5] bg-[var(--paper)]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-[var(--fog)]">No image</div>
                )}
              </div>
            </div>

            <div>
              <p className="skin-badge">{product.blurb ? "Featured" : "Product"}</p>
              <h1 className="skin-heading mt-4 text-4xl sm:text-5xl">{product.name}</h1>
              <p className="mt-3 font-display text-2xl font-bold text-[var(--hot)]">{product.price}</p>
              <p className="mt-2 text-sm text-[var(--fog)]">{product.blurb}</p>

              {product.sizes.length > 0 ? (
                <div className="mt-8">
                  <p className="mb-2 text-xs font-bold tracking-wide text-[var(--fog)] uppercase">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`skin-btn min-w-11 px-3 py-2 text-xs font-bold ${
                          size === s ? "ring-2 ring-[var(--accent-ui)]" : ""
                        }`}
                        aria-pressed={size === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {product.colors.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-bold tracking-wide text-[var(--fog)] uppercase">
                    Color{color ? ` · ${color}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.name)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                          color === c.name ? "border-[var(--ink)] scale-110" : "border-transparent"
                        }`}
                        style={{ background: c.hex }}
                        title={c.name}
                        aria-label={c.name}
                        aria-pressed={color === c.name}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" className="skin-btn border-0 px-6" onClick={onAdd}>
                  {added ? "Added" : "Add to bag"}
                </Button>
              </div>

              {product.description ? (
                <div className="skin-rule mt-10 pt-8">
                  <h2 className="skin-heading text-lg">Details</h2>
                  <div className="mt-4 space-y-3 text-base leading-relaxed text-[var(--fog)] whitespace-pre-wrap">
                    {product.description}
                  </div>
                </div>
              ) : null}

              {slug ? (
                <p className="mt-8 text-[10px] tracking-wide text-[var(--fog)] uppercase">/{slug}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
