"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kumooo/ui";

export type BagItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: string;
  size: string | null;
  color: string | null;
  qty: number;
};

type BagContextValue = {
  bag: BagItem[];
  count: number;
  add: (item: Omit<BagItem, "key" | "qty"> & { qty?: number }) => void;
  clear: () => void;
};

const BagContext = React.createContext<BagContextValue | null>(null);
const STORAGE_KEY = "kumooo_shop_bag";

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [bag, setBag] = React.useState<BagItem[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBag(JSON.parse(raw) as BagItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
    } catch {
      /* ignore */
    }
  }, [bag, ready]);

  const add = React.useCallback((item: Omit<BagItem, "key" | "qty"> & { qty?: number }) => {
    const key = `${item.productId}:${item.size || "-"}:${item.color || "-"}`;
    setBag((prev) => {
      const hit = prev.find((i) => i.key === key);
      if (hit) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + (item.qty || 1) } : i));
      }
      return [...prev, { ...item, key, qty: item.qty || 1 }];
    });
  }, []);

  const clear = React.useCallback(() => setBag([]), []);
  const count = bag.reduce((n, i) => n + i.qty, 0);

  const value = React.useMemo(() => ({ bag, count, add, clear }), [bag, count, add, clear]);

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = React.useContext(BagContext);
  if (!ctx) throw new Error("useBag requires BagProvider");
  return ctx;
}

export function BagButton() {
  const { bag, count, clear } = useBag();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="skin-btn px-3 py-1.5 text-xs font-bold">
          Bag ({count})
        </button>
      </DialogTrigger>
      <DialogContent className="border-[var(--ink)]/20 bg-[var(--surface)] text-[var(--ink)]">
        <DialogHeader>
          <DialogTitle className="skin-heading text-xl">Bag</DialogTitle>
          <DialogDescription className="text-[var(--fog)]">Demo only - no payment.</DialogDescription>
        </DialogHeader>
        {bag.length === 0 ? (
          <p className="text-sm text-[var(--fog)]">Empty.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {bag.map((i) => (
              <li key={i.key} className="flex justify-between gap-4">
                <span>
                  {i.name}
                  {(i.size || i.color) && (
                    <span className="block text-xs text-[var(--fog)]">
                      {[i.size, i.color].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="text-[var(--fog)]"> × {i.qty}</span>
                </span>
                <span className="font-semibold">{i.price}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Button
            disabled={!bag.length}
            className="skin-btn flex-1 border-0"
            onClick={() => alert("Demo only - no payment.")}
          >
            Checkout
          </Button>
          {bag.length ? (
            <Button type="button" variant="outline" className="skin-btn border-0" onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
