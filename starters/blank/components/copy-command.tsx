"use client";

import * as React from "react";
import { Button } from "@kumooo/ui";

const COMMAND = "npx create-kumooo";

export function CopyCommand() {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button type="button" onClick={onCopy} className="font-mono text-[13px] tracking-tight">
      {copied ? "Copied" : COMMAND}
    </Button>
  );
}
