"use client";

import * as React from "react";
import Link from "next/link";
import { FadeIn, Stagger } from "@kumooo/ui";
import { BagButton } from "../components/bag";
import { Masthead } from "../components/masthead";
import { shopApi, type Product } from "../lib/api";

export default function ShopHome() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await shopApi.listProducts();
        if (!cancelled) setProducts(data.products);
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
      <Masthead bagSlot={<BagButton />} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <FadeIn>
          <p className="skin-badge mb-4">Drop</p>
          <h1 className="font-display skin-title text-5xl leading-[0.95] sm:text-7xl">
            Catalog
            <span className="text-[var(--hot)]">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-[var(--fog)]">
            Demo catalog with a local bag. No real payments. Demo data resets daily at 00:00 UTC.
          </p>
        </FadeIn>

        {loading ? <p className="mt-12 font-display text-sm">Loading catalog...</p> : null}
        {error ? (
          <p className="mt-12 border-2 border-[var(--ink)] bg-[var(--hot)] px-4 py-3 text-sm font-bold text-black">
            Could not load products ({error}). Is the API up?
          </p>
        ) : null}

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="skin-card flex flex-col overflow-hidden p-0 no-underline transition-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--paper)]">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full place-items-center font-display text-xs tracking-widest text-[var(--fog)] uppercase">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h2 className="skin-heading text-xl text-[var(--ink)]">{p.name}</h2>
                  <p className="skin-muted mt-1 text-sm leading-relaxed">{p.blurb}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="font-display text-lg font-bold text-[var(--hot)]">{p.price}</span>
                  <span className="text-xs font-bold tracking-wide text-[var(--cyan)] uppercase">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </Stagger>
      </main>
    </>
  );
}
