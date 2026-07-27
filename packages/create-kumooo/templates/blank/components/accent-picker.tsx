"use client";

import * as React from "react";

const STORAGE_KEY = "kumooo-blank-accent";
const DEFAULT_ACCENT = "#0d9488";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance(hex: string): number {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function applyAccent(hex: string) {
  const root = document.documentElement;
  const { h, s, l } = hexToHsl(hex);
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${l}%`);
  root.style.setProperty("--mint", hex);
  const fg = luminance(hex) > 0.55 ? "160 10% 8%" : "0 0% 100%";
  root.style.setProperty("--primary-foreground", fg);
  const glow =
    luminance(hex) > 0.55
      ? `color-mix(in srgb, ${hex} 28%, transparent)`
      : `color-mix(in srgb, ${hex} 18%, transparent)`;
  root.style.setProperty("--glow", glow);
}

const PRESETS = ["#0d9488", "#6ee7b7", "#3b82f6", "#a855f7", "#f43f5e", "#f59e0b", "#14b8a6", "#e11d48"];

export function AccentPicker() {
  const [hex, setHex] = React.useState(DEFAULT_ACCENT);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const next = saved && /^#[0-9a-fA-F]{6}$/.test(saved) ? saved : DEFAULT_ACCENT;
      setHex(next);
      applyAccent(next);
    } catch {
      applyAccent(DEFAULT_ACCENT);
    }
  }, []);

  function onPick(next: string) {
    setHex(next);
    applyAccent(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[hsl(var(--border))] shadow-sm ring-2 ring-[hsl(var(--ring))]/30">
        <span
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #14b8a6, #3b82f6, #a855f7, #ec4899, #ef4444)",
          }}
          aria-hidden
        />
        <span
          className="relative z-[1] h-5 w-5 rounded-full border-2 border-white shadow"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => onPick(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pick accent color"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            aria-label={`Accent ${color}`}
            className="h-7 w-7 rounded-full border border-black/10 transition-transform hover:scale-110 dark:border-white/15"
            style={{
              backgroundColor: color,
              outline: hex.toLowerCase() === color.toLowerCase() ? `2px solid ${color}` : undefined,
              outlineOffset: 2,
            }}
          />
        ))}
      </div>
      <code className="rounded bg-[hsl(var(--muted))] px-2 py-1 font-mono text-xs text-[hsl(var(--foreground))]">
        {hex}
      </code>
    </div>
  );
}
