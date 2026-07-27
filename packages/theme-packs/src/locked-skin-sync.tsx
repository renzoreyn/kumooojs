"use client";

/**
 * Optional locked-skin sync for customer starters.
 * Set NEXT_PUBLIC_SITE_SLUG to load skin from GET /public/sites/:slug
 * or NEXT_PUBLIC_SITE_SKIN to force a skin without the API.
 * Demos with SkinPicker should omit this component.
 */
import * as React from "react";
import { applySkin, isSkinId, type SkinId } from "@kumooo/theme-packs";

const API =
  process.env.NEXT_PUBLIC_KUMOOO_API_URL?.replace(/\/$/, "") || "https://api.kumooo.dev";

export function LockedSkinSync({
  slug = process.env.NEXT_PUBLIC_SITE_SLUG,
  fallback = (process.env.NEXT_PUBLIC_SITE_SKIN as SkinId | undefined) || "kumooo",
}: {
  slug?: string;
  fallback?: SkinId;
}) {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (slug) {
        try {
          const res = await fetch(`${API}/public/sites/${encodeURIComponent(slug)}`);
          if (res.ok) {
            const data = (await res.json()) as { skin?: string };
            if (!cancelled && isSkinId(data.skin)) {
              applySkin(data.skin, { persist: false });
              return;
            }
          }
        } catch {
          /* fall through */
        }
      }
      if (!cancelled && isSkinId(fallback)) applySkin(fallback, { persist: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, fallback]);

  return null;
}
