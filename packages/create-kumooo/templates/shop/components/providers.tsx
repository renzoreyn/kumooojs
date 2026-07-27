"use client";

import { BagProvider } from "./bag";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BagProvider>{children}</BagProvider>;
}
