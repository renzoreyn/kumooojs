"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dropzone,
  FadeIn,
  Input,
  Label,
  Stagger,
} from "@kumooo/ui";
import { AccentPicker } from "./accent-picker";

export function KitPlayground() {
  const [filesLabel, setFilesLabel] = React.useState("No files yet");

  return (
    <section className="relative z-10 border-t border-[hsl(var(--border))]/80">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
        <FadeIn className="max-w-xl">
          <p className="text-sm font-medium tracking-[0.14em] text-[var(--mint)] uppercase">Playground</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-[-0.03em] text-[hsl(var(--foreground))] sm:text-4xl">
            Taste the kit
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Primitives from @kumooo/ui. Spin the accent, click around, then delete this section and keep the bones.
          </p>
        </FadeIn>

        <FadeIn delay={0.05} className="mt-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-5 sm:p-6">
          <p className="text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
            Accent
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Live theme token. Updates primary, ring, mint, and glow.
          </p>
          <div className="mt-4">
            <AccentPicker />
          </div>
        </FadeIn>

        <Stagger className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
              Buttons
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
              Field
            </p>
            <div className="space-y-2">
              <Label htmlFor="playground-email">Email</Label>
              <Input id="playground-email" type="email" placeholder="you@studio.dev" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playground-name">Name</Label>
              <Input id="playground-name" placeholder="Studio name" />
            </div>
          </div>

          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))]/80">
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>
                Use cards for actions and forms. Skip them in heroes and marketing strips.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm">Card action</Button>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center gap-4">
            <p className="text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
              Dialog
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>It opens. Nice.</DialogTitle>
                  <DialogDescription>
                    Radix under the hood. Close with the X, Escape, or a click outside.
                  </DialogDescription>
                </DialogHeader>
                <Button className="mt-2">Primary in dialog</Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <p className="text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
              Dropzone
            </p>
            <Dropzone
              label="Drop files here or click to browse"
              onFiles={(list) => setFilesLabel(`${list.length} file${list.length === 1 ? "" : "s"} ready`)}
            />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{filesLabel}</p>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-medium tracking-[0.14em] text-[hsl(var(--muted-foreground))] uppercase">
              Code
            </p>
            <CodeBlock
              language="bash"
              code={`npx create-kumooo my-app
cd my-app
pnpm dev`}
            />
          </div>
        </Stagger>
      </div>
    </section>
  );
}
