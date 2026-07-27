"use client";

import * as React from "react";
import {
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_SKIN,
  SKIN_LABELS,
  SKINS,
  applySkin,
  applySkinFavicon,
  isSkinId,
  type SkinId,
} from "./skins";

export function ColorModeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="skin-btn inline-flex h-9 w-9 items-center justify-center"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function SkinPicker() {
  const [skin, setSkin] = React.useState<SkinId>(DEFAULT_SKIN);

  React.useEffect(() => {
    const current = document.documentElement.getAttribute("data-skin");
    if (isSkinId(current)) {
      setSkin(current);
      applySkinFavicon(current);
    }
  }, []);

  function pick(next: SkinId) {
    applySkin(next, { persist: true });
    setSkin(next);
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Theme skin">
      {SKINS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => pick(id)}
          className={`skin-btn px-2.5 py-1.5 text-[10px] font-bold tracking-wide uppercase ${
            skin === id ? "ring-2 ring-[var(--accent-ui)]" : ""
          }`}
          aria-pressed={skin === id}
        >
          {SKIN_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
