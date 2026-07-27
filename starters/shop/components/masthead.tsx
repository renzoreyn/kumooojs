import Link from "next/link";
import type { ReactNode } from "react";
import { ColorModeToggle, SkinPicker } from "@kumooo/theme-packs";
import { BrandMark } from "./brand-mark";

export function Masthead({
  admin,
  bagSlot,
}: {
  admin?: boolean;
  bagSlot?: ReactNode;
}) {
  return (
    <header className="skin-masthead">
      <div className="skin-scanlines" aria-hidden />
      <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5 text-[var(--ink)] no-underline">
          <BrandMark className="h-8 w-8" />
          <span className="skin-brand text-sm sm:text-base">
            kumooo<span className="text-[var(--hot)]">.js</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="skin-badge hidden sm:inline">Shop</span>
          <span className="hidden text-[10px] font-bold tracking-wide text-[var(--fog)] md:inline">
            Resets 00:00 UTC
          </span>
          <SkinPicker />
          {bagSlot}
          {admin ? (
            <Link href="/" className="skin-btn px-3 py-1.5 text-xs font-bold no-underline">
              Storefront
            </Link>
          ) : (
            <Link href="/admin" className="skin-btn px-3 py-1.5 text-xs font-bold no-underline">
              Admin
            </Link>
          )}
          <ColorModeToggle />
        </div>
      </div>
    </header>
  );
}
