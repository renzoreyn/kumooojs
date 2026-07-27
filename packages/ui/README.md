# @kumooo/ui

Design system for **kumooo.js**.

- shadcn-style primitives (Button, Input, Dialog, Card, …)
- Kibo-ready registry (`components.json` points at Kibo UI) + included Dropzone / CodeBlock patterns
- `@radix-ui/react-icons` re-exported from `@kumooo/ui`
- Framer Motion helpers: `FadeIn`, `Stagger`, `Motion` (respect `prefers-reduced-motion`)

```tsx
import { Button, FadeIn, RocketIcon } from "@kumooo/ui";
import "@kumooo/ui/globals.css";
```

Add more Kibo blocks with the Kibo / shadcn CLI into this package or a starter.
