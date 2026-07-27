"use client";

import * as React from "react";
import { UploadIcon } from "@radix-ui/react-icons";
import { cn } from "../lib/cn";

/** Kibo-style dropzone pattern (composable file drop UI). */
export function Dropzone({
  className,
  onFiles,
  accept,
  label = "Drop files here or click to browse",
}: {
  className?: string;
  onFiles?: (files: FileList) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [active, setActive] = React.useState(false);

  function handleFiles(files: FileList | null) {
    if (files && files.length && onFiles) onFiles(files);
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-6 py-10 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]/70",
        active && "border-[hsl(var(--ring))] bg-[hsl(var(--accent))]",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <UploadIcon className="h-5 w-5" />
      <span>{label}</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}
