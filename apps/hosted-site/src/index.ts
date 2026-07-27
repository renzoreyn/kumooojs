/**
 * Reference Worker for hosted blank/blog/shop shells.
 * Production uploads use the module string in apps/api/src/lib/hosted-site-worker.ts
 * (keep behavior in sync when changing either).
 */
import {
  blockDocumentCss,
  googleFontsHref,
  renderDocumentToHtml,
  siteFontFamilyCss,
  type PageDocument,
} from "@kumooo/blocks";
import {
  COLOR_MODE_STORAGE_KEY,
  isSkinId,
  SKINS_CSS,
  themeBootScript,
  type SkinId,
} from "@kumooo/theme-packs/skins";

export interface Env {
  API_ORIGIN: string;
  SITE_SUFFIX?: string;
  /** Prefer service binding so we never loop through dispatch on api.kumooo.dev. */
  API?: Fetcher;
}

function apiFetch(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const origin = (env.API_ORIGIN || "https://api.kumooo.dev").replace(/\/$/, "");
  const url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  if (env.API) {
    return env.API.fetch(new Request(url, init));
  }
  return fetch(url, init);
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const html = makeHtmlResponder(env);
    const url = new URL(request.url);
    let slug = slugFromHost(url.hostname, env.SITE_SUFFIX || "kumooo.site");
    if (!slug) {
      slug = await resolveCustomSlug(env, url.hostname);
    }
    if (!slug) {
      return html(
        pageShell("kumooo", "Site", "<h1>Missing slug</h1><p>Host must be {slug}.kumooo.site or a linked custom domain.</p>", "blank"),
        400,
      );
    }

    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/robots.txt") {
      const res = await apiFetch(env, `/public/sites/${encodeURIComponent(slug)}/robots.txt`);
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      });
    }

    if (path === "/sitemap.xml") {
      const res = await apiFetch(env, `/public/sites/${encodeURIComponent(slug)}/sitemap.xml`);
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      });
    }

    let meta: PublicSite | { error: string };
    try {
      meta = await getJson<PublicSite>(env, `/public/sites/${encodeURIComponent(slug)}`);
    } catch {
      return html(
        pageShell("kumooo", slug, "<h1>Could not load site</h1><p>Try again in a minute.</p>", "blank"),
        502,
      );
    }
    if (hasError(meta)) {
      const claim = `https://app.kumooo.dev/sites/new?slug=${encodeURIComponent(slug)}`;
      return html(unclaimedShell(slug, claim), 404);
    }

    const siteMeta: PublicSite = meta;
    const skin = siteMeta.skin || "kumooo";
    const name = siteMeta.name || slug;
    const template =
      siteMeta.template === "blog" || siteMeta.template === "shop" ? siteMeta.template : "blank";
    const useSkin = template === "blog" || template === "shop";
    const apiOrigin = (env.API_ORIGIN || "https://api.kumooo.dev").replace(/\/$/, "");
    const pageLinks = await loadPageLinks(env, slug);
    const theme = {
      themeAccent: siteMeta.themeAccent,
      themeBg: siteMeta.themeBg,
      themeFg: siteMeta.themeFg,
      themeFont: siteMeta.themeFont,
      themeFontUrl: siteMeta.themeFontUrl,
      apiOrigin,
      siteSlug: slug,
      hideCredit: siteMeta.showCredit === false,
      iconUrl: siteMeta.iconUrl,
      logoUrl: siteMeta.logoUrl,
    };
    const chromeCtx = {
      ...renderCtx(pageLinks),
      chrome: useSkin ? ("skin" as const) : ("plain" as const),
    };

    function shellBody(homeHref: string | null, content: string): string {
      return `${renderHeader(siteMeta, name, homeHref, pageLinks, chromeCtx, useSkin)}${content}${renderFooter(siteMeta, chromeCtx)}`;
    }

    if (path.startsWith("/pages/")) {
      const pageSlug = path.slice("/pages/".length).split("/")[0]!;
      const data = await getJson<{ page?: PublicPage }>(
        env,
        `/public/sites/${encodeURIComponent(slug)}/pages/${encodeURIComponent(pageSlug)}`,
      ).catch((): { page?: PublicPage } => ({ page: undefined }));
      if (hasError(data) || !data.page) {
        return html(
          pageShell(
            skin,
            titleFor(siteMeta, "Not found"),
            shellBody("/", "<h1>Page not found</h1>"),
            template,
            theme,
          ),
          404,
        );
      }
      const p = data.page;
      const content = p.document
        ? renderDocumentToHtml(p.document, chromeCtx)
        : `<div class="prose">${escapeHtml(p.body || "").replace(/\n/g, "<br/>")}</div>`;
      const heading = useSkin
        ? `<h1 class="skin-heading">${escapeHtml(p.title)}</h1>`
        : `<h1>${escapeHtml(p.title)}</h1>`;
      const body = shellBody("/", `<article class="wrap">${heading}${content}</article>`);
      return html(
        pageShell(skin, titleFor(siteMeta, p.metaTitle || p.title), body, template, {
          ...theme,
          description: p.metaDescription || siteMeta.metaDescription,
          ogImage: p.ogImageUrl || siteMeta.ogImageUrl,
          canonical: p.canonicalUrl,
        }),
      );
    }

    if (template === "blog") {
      if (path.startsWith("/posts/")) {
        const postSlug = path.slice("/posts/".length).split("/")[0]!;
        const data = await getJson<{ post?: PublicPost }>(
          env,
          `/public/sites/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postSlug)}`,
        ).catch((): { post?: PublicPost } => ({ post: undefined }));
        if (hasError(data) || !data.post) {
          return html(
            pageShell(
              skin,
              titleFor(siteMeta, "Not found"),
              shellBody("/", "<h1>Post not found</h1>"),
              template,
              theme,
            ),
            404,
          );
        }
        const p = data.post;
        const content = p.document
          ? renderDocumentToHtml(p.document, chromeCtx)
          : `<div class="prose">${escapeHtml(p.body || "").replace(/\n/g, "<br/>")}</div>`;
        const body = shellBody(
          "/",
          `<article class="wrap"><h1 class="skin-heading">${escapeHtml(p.title)}</h1>${
            p.excerpt ? `<p class="skin-muted">${escapeHtml(p.excerpt)}</p>` : ""
          }${content}</article>`,
        );
        return html(
          pageShell(skin, titleFor(siteMeta, p.metaTitle || p.title), body, template, {
            ...theme,
            description: p.metaDescription || p.excerpt || siteMeta.metaDescription,
            ogImage: p.ogImageUrl || siteMeta.ogImageUrl,
            canonical: p.canonicalUrl,
          }),
        );
      }
      const data = await getJson<{ posts: PublicPost[] }>(
        env,
        `/public/sites/${encodeURIComponent(slug)}/posts`,
      ).catch((): { posts: PublicPost[] } => ({ posts: [] }));
      const posts = hasError(data) ? [] : data.posts || [];
      const list =
        posts.length === 0
          ? `<p class="skin-muted">Nothing published yet. Write a post in the dashboard.</p>`
          : `<ul class="skin-post-list">${posts
              .map(
                (p) =>
                  `<li><a class="skin-card" href="/posts/${encodeURIComponent(p.slug)}"><span class="skin-badge">Post</span><h2 class="skin-heading">${escapeHtml(p.title)}</h2>${
                    p.excerpt ? `<p class="skin-muted">${escapeHtml(p.excerpt)}</p>` : ""
                  }</a></li>`,
              )
              .join("")}</ul>`;
      return html(
        pageShell(
          skin,
          titleFor(siteMeta, name),
          shellBody(
            null,
            `<div class="wrap wrap-wide"><p class="skin-badge">Blog</p><h1 class="font-display skin-title">${escapeHtml(name)}</h1>${list}</div>`,
          ),
          template,
          { ...theme, description: siteMeta.metaDescription, ogImage: siteMeta.ogImageUrl },
        ),
      );
    }

    if (template === "shop") {
      if (path.startsWith("/products/")) {
        const productSlug = path.slice("/products/".length).split("/")[0]!;
        const data = await getJson<{ product?: PublicProduct }>(
          env,
          `/public/sites/${encodeURIComponent(slug)}/products/${encodeURIComponent(productSlug)}`,
        ).catch((): { product?: PublicProduct } => ({ product: undefined }));
        if (hasError(data) || !data.product) {
          return html(
            pageShell(
              skin,
              titleFor(siteMeta, "Not found"),
              shellBody("/", "<h1>Product not found</h1>"),
              template,
              theme,
            ),
            404,
          );
        }
        const p = data.product;
        const content = p.document
          ? renderDocumentToHtml(p.document, chromeCtx)
          : `<div class="prose">${escapeHtml(p.description || "").replace(/\n/g, "<br/>")}</div>`;
        const body = shellBody(
          "/",
          `<article class="wrap">${
            p.imageUrl ? `<img class="hero-img" src="${escapeAttr(p.imageUrl)}" alt="" />` : ""
          }<h1 class="skin-heading">${escapeHtml(p.name)}</h1><p class="skin-price">${formatMoney(p.priceCents)}</p>${
            p.blurb ? `<p class="skin-muted">${escapeHtml(p.blurb)}</p>` : ""
          }${content}<p class="skin-muted">Bag is pretend. No checkout here.</p></article>`,
        );
        return html(
          pageShell(skin, titleFor(siteMeta, p.name), body, template, {
            ...theme,
            description: p.blurb || siteMeta.metaDescription,
            ogImage: p.imageUrl || siteMeta.ogImageUrl,
          }),
        );
      }
      const data = await getJson<{ products: PublicProduct[] }>(
        env,
        `/public/sites/${encodeURIComponent(slug)}/products`,
      ).catch((): { products: PublicProduct[] } => ({ products: [] }));
      const products = hasError(data) ? [] : data.products || [];
      const grid =
        products.length === 0
          ? `<p class="skin-muted">Catalog is empty. Add products in the dashboard.</p>`
          : `<div class="skin-product-grid">${products
              .map(
                (p) =>
                  `<a class="skin-card" href="/products/${encodeURIComponent(p.slug)}">${
                    p.imageUrl ? `<img src="${escapeAttr(p.imageUrl)}" alt="" />` : ""
                  }<div class="skin-card-body"><h2 class="skin-heading">${escapeHtml(p.name)}</h2><span class="skin-price">${formatMoney(p.priceCents)}</span>${
                    p.blurb ? `<p class="skin-muted">${escapeHtml(p.blurb)}</p>` : ""
                  }</div></a>`,
              )
              .join("")}</div>`;
      return html(
        pageShell(
          skin,
          titleFor(siteMeta, name),
          shellBody(
            null,
            `<div class="wrap wrap-wide"><p class="skin-badge">Drop</p><h1 class="font-display skin-title">${escapeHtml(name)}</h1>${grid}</div>`,
          ),
          template,
          { ...theme, description: siteMeta.metaDescription, ogImage: siteMeta.ogImageUrl },
        ),
      );
    }

    // Blank home: designated published home page, else page list.
    if (siteMeta.homePageSlug) {
      const data = await getJson<{ page?: PublicPage }>(
        env,
        `/public/sites/${encodeURIComponent(slug)}/pages/${encodeURIComponent(siteMeta.homePageSlug)}`,
      ).catch((): { page?: PublicPage } => ({ page: undefined }));
      if (!hasError(data) && data.page) {
        const p = data.page;
        const content = p.document
          ? renderDocumentToHtml(p.document, chromeCtx)
          : `<div class="prose">${escapeHtml(p.body || "").replace(/\n/g, "<br/>")}</div>`;
        const body = shellBody(null, `<article class="wrap">${content}</article>`);
        return html(
          pageShell(skin, titleFor(siteMeta, p.metaTitle || p.title || name), body, template, {
            ...theme,
            description: p.metaDescription || siteMeta.metaDescription,
            ogImage: p.ogImageUrl || siteMeta.ogImageUrl,
            canonical: p.canonicalUrl,
          }),
        );
      }
    }

    const pageList =
      pageLinks.length === 0
        ? `<p class="muted">Empty on purpose. Add a page, set it as home, and publish.</p>`
        : `<ul class="list">${pageLinks
            .map(
              (p) =>
                `<li><a href="/pages/${encodeURIComponent(p.slug)}"><strong>${escapeHtml(p.title)}</strong></a></li>`,
            )
            .join("")}</ul>`;
    const body = shellBody(
      null,
      `<div class="wrap hero"><p class="badge">Blank</p><h1>${escapeHtml(name)}</h1>${pageList}<p><a class="btn" href="https://app.kumooo.dev">Dashboard</a></p></div>`,
    );
    return html(
      pageShell(skin, titleFor(siteMeta, name), body, template, {
        ...theme,
        description: siteMeta.metaDescription,
        ogImage: siteMeta.ogImageUrl,
      }),
    );
  },
};

type PublicSite = {
  name: string;
  slug: string;
  skin: string;
  template: string;
  status: string;
  homePageSlug?: string | null;
  themeAccent?: string | null;
  themeBg?: string | null;
  themeFg?: string | null;
  themeFont?: string | null;
  themeFontUrl?: string | null;
  /** When false, hide the made-with pill (Cumulus+). Default true for Nimbus. */
  showCredit?: boolean;
  headerDocument?: PageDocument | null;
  footerDocument?: PageDocument | null;
  metaTitleTemplate?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  logoUrl?: string | null;
  iconUrl?: string | null;
};

type PublicPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  document?: PageDocument | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
};

type PublicPage = {
  slug: string;
  title: string;
  body: string;
  document?: PageDocument | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
};

type PublicProduct = {
  slug: string;
  name: string;
  blurb: string;
  description: string;
  document?: PageDocument | null;
  priceCents: number;
  imageUrl: string | null;
};

type PageLink = { slug: string; title: string };

type HeadMeta = {
  description?: string | null;
  ogImage?: string | null;
  canonical?: string | null;
  themeAccent?: string | null;
  themeBg?: string | null;
  themeFg?: string | null;
  themeFont?: string | null;
  themeFontUrl?: string | null;
  apiOrigin?: string;
  siteSlug?: string;
  /** Hide the floating made-with pill (error / unclaimed pages). */
  hideCredit?: boolean;
  iconUrl?: string | null;
  logoUrl?: string | null;
};

async function loadPageLinks(env: Env, slug: string): Promise<PageLink[]> {
  const data = await getJson<{ pages: PageLink[] }>(
    env,
    `/public/sites/${encodeURIComponent(slug)}/pages`,
  ).catch((): { pages: PageLink[] } => ({ pages: [] }));
  if (hasError(data)) return [];
  return data.pages || [];
}

function titleFor(meta: PublicSite, pageTitle: string): string {
  const site = meta.name || meta.slug;
  const tpl = meta.metaTitleTemplate?.trim();
  if (tpl) {
    return tpl.replace(/\{page\}/g, pageTitle).replace(/\{site\}/g, site);
  }
  if (!pageTitle || pageTitle === site) return site;
  return `${pageTitle} · ${site}`;
}

function slugFromHost(hostname: string, suffix: string): string | null {
  const host = hostname.toLowerCase();
  const s = suffix.toLowerCase();
  if (host === s) return null;
  if (!host.endsWith(`.${s}`)) return null;
  const slug = host.slice(0, -(s.length + 1));
  if (!slug || slug.includes(".")) return null;
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return null;
  return slug;
}

async function resolveCustomSlug(env: Env, hostname: string): Promise<string | null> {
  const host = hostname.toLowerCase();
  if (!host || host.endsWith(".kumooo.site") || host === "kumooo.site") return null;
  if (host.endsWith(".kumooo.dev") || host === "kumooo.dev") return null;
  try {
    const res = await apiFetch(env, `/public/hosts/${encodeURIComponent(host)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { slug?: string };
    return json.slug || null;
  } catch {
    return null;
  }
}

async function getJson<T>(env: Env, path: string): Promise<T | { error: string }> {
  const res = await apiFetch(env, path, { headers: { accept: "application/json" } });
  if (res.status === 404) return { error: "not_found" };
  if (!res.ok) throw new Error("upstream");
  return (await res.json()) as T;
}

function hasError(value: unknown): value is { error: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function formatMoney(cents: number): string {
  return `$${((Number(cents) || 0) / 100).toFixed(2)}`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function isHexColor(value: string | null | undefined): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}

function nav(name: string, homeHref: string | null, pages: PageLink[], useSkin: boolean): string {
  if (useSkin) {
    const links = pages
      .slice(0, 6)
      .map(
        (p) =>
          `<a class="skin-btn" href="/pages/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>`,
      )
      .join("");
    return `<header class="skin-masthead"><div class="skin-scanlines" aria-hidden="true"></div><div class="skin-masthead-inner"><a class="skin-brand" href="${homeHref || "/"}">${escapeHtml(name)}</a><div class="skin-masthead-nav">${links}<a class="skin-btn" href="https://app.kumooo.dev">Edit</a><button type="button" class="skin-btn skin-mode-toggle" aria-label="Toggle color mode">Theme</button></div></div></header>`;
  }
  const links = pages
    .slice(0, 6)
    .map(
      (p) =>
        `<a class="ghost" href="/pages/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>`,
    )
    .join("");
  return `<header class="mast"><div class="wrap row"><a class="brand" href="${homeHref || "/"}">${escapeHtml(name)}</a><nav class="nav">${links}<a class="ghost" href="https://app.kumooo.dev">Edit</a></nav></div></header>`;
}

function renderCtx(pages: PageLink[]) {
  return {
    pages: pages.map((p) => ({
      title: p.title,
      href: `/pages/${encodeURIComponent(p.slug)}`,
    })),
  };
}

function renderHeader(
  meta: PublicSite,
  name: string,
  homeHref: string | null,
  pages: PageLink[],
  ctx: ReturnType<typeof renderCtx> & { chrome: "plain" | "skin" },
  useSkin: boolean,
): string {
  if (meta.headerDocument?.blocks?.length) {
    if (useSkin) {
      return `<header class="skin-masthead"><div class="skin-scanlines" aria-hidden="true"></div><div class="skin-masthead-inner">${renderDocumentToHtml(meta.headerDocument, ctx)}</div></header>`;
    }
    return `<header class="site-chrome"><div class="site-chrome-inner">${renderDocumentToHtml(meta.headerDocument, ctx)}</div></header>`;
  }
  return nav(name, homeHref, pages, useSkin);
}

function renderFooter(
  meta: PublicSite,
  ctx: ReturnType<typeof renderCtx> & { chrome: "plain" | "skin" },
): string {
  if (meta.footerDocument?.blocks?.length) {
    return `<footer class="site-footer"><div class="site-footer-inner">${renderDocumentToHtml(meta.footerDocument, ctx)}</div></footer>`;
  }
  return "";
}

function siteRuntimeScript(apiOrigin: string, siteSlug: string): string {
  const api = JSON.stringify(apiOrigin.replace(/\/$/, ""));
  const slug = JSON.stringify(siteSlug);
  // text/plain keeps sendBeacon CORS-simple (application/json is often dropped cross-origin).
  return `<script>(function(){var API=${api},SLUG=${slug};try{var path=location.pathname||"/";var body=JSON.stringify({path:path});var url=API+"/public/sites/"+encodeURIComponent(SLUG)+"/collect";var sent=false;try{if(navigator.sendBeacon){sent=navigator.sendBeacon(url,new Blob([body],{type:"text/plain;charset=UTF-8"}));}}catch(e){}if(!sent){fetch(url,{method:"POST",headers:{"content-type":"text/plain;charset=UTF-8"},body:body,keepalive:true,mode:"cors",credentials:"omit"}).catch(function(){});}}catch(e){}function status(el,msg,ok){if(!el)return;el.hidden=!msg;el.textContent=msg||"";el.className="blk-form-status"+(msg?(ok?" is-ok":" is-err"):"");}document.addEventListener("submit",function(ev){var form=ev.target;if(!(form instanceof HTMLFormElement)||!form.hasAttribute("data-kumooo-form"))return;ev.preventDefault();var id=form.getAttribute("data-form-id");if(!id)return;var btn=form.querySelector('button[type="submit"]');var note=form.querySelector(".blk-form-status");var values={};new FormData(form).forEach(function(v,k){if(typeof v==="string")values[k]=v;});if(btn)btn.disabled=true;status(note,"Sending…",true);fetch(API+"/public/sites/"+encodeURIComponent(SLUG)+"/forms/"+encodeURIComponent(id)+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({values:values,pagePath:location.pathname})}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});}).then(function(res){if(!res.ok){var msg=(res.j&&res.j.error)||"Could not send";if(res.j&&res.j.error==="validation")msg="Check the required fields.";status(note,msg,false);if(btn)btn.disabled=false;return;}form.reset();status(note,form.getAttribute("data-success")||"Got it.",true);if(btn)btn.disabled=false;}).catch(function(){status(note,"Network error. Try again.",false);if(btn)btn.disabled=false;});});})();</script>`;
}

function colorModeToggleScript(): string {
  return `<script>(function(){var K=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};document.querySelectorAll(".skin-mode-toggle").forEach(function(b){b.addEventListener("click",function(){var d=!document.documentElement.classList.contains("dark");document.documentElement.classList.toggle("dark",d);try{localStorage.setItem(K,d?"dark":"light");}catch(e){}});});})();</script>`;
}

function pageShell(
  skin: string,
  title: string,
  body: string,
  template: string,
  head: HeadMeta = {},
): string {
  const useSkin = template === "blog" || template === "shop";
  const desc = head.description
    ? `<meta name="description" content="${escapeAttr(head.description)}"/>`
    : "";
  const ogTitle = `<meta property="og:title" content="${escapeAttr(title)}"/>`;
  const ogDesc = head.description
    ? `<meta property="og:description" content="${escapeAttr(head.description)}"/>`
    : "";
  const ogImg = head.ogImage
    ? `<meta property="og:image" content="${escapeAttr(head.ogImage)}"/>`
    : "";
  const canonical = head.canonical
    ? `<link rel="canonical" href="${escapeAttr(head.canonical)}"/>`
    : "";
  const favicon = head.iconUrl
    ? `<link rel="icon" href="${escapeAttr(head.iconUrl)}"/>`
    : "";
  const runtime =
    head.apiOrigin && head.siteSlug
      ? siteRuntimeScript(head.apiOrigin, head.siteSlug)
      : "";
  const credit = head.hideCredit ? "" : madeWithCreditHtml();

  if (!useSkin) {
    const accents = { y2k: "#ff2bd6", kumooo: "#0d9488", glass: "#0071e3" };
    const skinAccent =
      skin === "y2k" || skin === "glass" || skin === "kumooo" ? accents[skin] : accents.kumooo;
    const accent =
      head.themeAccent && /^#[0-9a-fA-F]{6}$/.test(head.themeAccent)
        ? head.themeAccent
        : skinAccent;
    const bg =
      head.themeBg && /^#[0-9a-fA-F]{6}$/.test(head.themeBg) ? head.themeBg : "";
    const fg =
      head.themeFg && /^#[0-9a-fA-F]{6}$/.test(head.themeFg) ? head.themeFg : "";
    const fontFamily = siteFontFamilyCss(head.themeFont, head.themeFontUrl);
    const googleHref = googleFontsHref(head.themeFont);
    const fontLink = googleHref
      ? `<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/><link href="${escapeAttr(googleHref)}" rel="stylesheet"/>`
      : "";
    const customFontFace =
      head.themeFont === "custom" && head.themeFontUrl
        ? `@font-face{font-family:kumooo-custom;src:url("${escapeAttr(head.themeFontUrl)}") format("woff2"),url("${escapeAttr(head.themeFontUrl)}");font-display:swap;}:root{--font-custom:kumooo-custom,ui-sans-serif,system-ui,sans-serif}`
        : "";
    return `<!doctype html><html lang="en" data-skin="${escapeAttr(skin)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title>${desc}${ogTitle}${ogDesc}${ogImg}${canonical}${favicon}${fontLink}<style>${customFontFace}${css(accent, bg, fg, fontFamily)}${blockDocumentCss()}</style></head><body data-template="${escapeAttr(template)}">${body}${credit}${runtime}</body></html>`;
  }

  const skinId: SkinId = isSkinId(skin) ? skin : "kumooo";
  const skinFontsHref =
    "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Orbitron:wght@500;700;800&family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap";
  const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/><link href="${escapeAttr(skinFontsHref)}" rel="stylesheet"/>`;
  const fontVars =
    `:root{--font-y2k-sans:"Space Grotesk",ui-sans-serif,system-ui,sans-serif;--font-y2k-display:"Orbitron",ui-sans-serif,system-ui,sans-serif;--font-kumooo-sans:"Figtree",ui-sans-serif,system-ui,sans-serif;--font-kumooo-display:"Outfit",ui-sans-serif,system-ui,sans-serif}`;
  const accentOverride = isHexColor(head.themeAccent)
    ? `html[data-skin]{--hot:${head.themeAccent};--accent-ui:${head.themeAccent}}`
    : "";
  const paperInkParts: string[] = [];
  if (isHexColor(head.themeBg)) paperInkParts.push(`--paper:${head.themeBg}`);
  if (isHexColor(head.themeFg)) paperInkParts.push(`--ink:${head.themeFg}`);
  const paperInkOverride = paperInkParts.length
    ? `html[data-skin]:not(.dark){${paperInkParts.join(";")}}`
    : "";
  const boot = `<script>${themeBootScript(skinId, { preferStored: false })}</script>`;
  const style = `${fontVars}${SKINS_CSS}${accentOverride}${paperInkOverride}${hostedSkinLayoutCss()}${blockDocumentCss()}`;
  return `<!doctype html><html lang="en" data-skin="${escapeAttr(skinId)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title>${desc}${ogTitle}${ogDesc}${ogImg}${canonical}${favicon}${fontLink}${boot}<style>${style}</style></head><body data-template="${escapeAttr(template)}">${body}${credit}${runtime}${colorModeToggleScript()}</body></html>`;
}

function madeWithCreditHtml(): string {
  return `<a class="kumooo-credit" href="https://kumooo.dev" target="_blank" rel="noopener noreferrer" aria-label="Made with kumooo"><span class="kumooo-credit-mark" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor"><g transform="translate(6.811 3.2) scale(0.071508)"><rect x="0" y="0" width="85" height="358"/><polygon points="85,252 133,185 134,185 147,204 161,223 174,242 187,261 201,280 214,299 228,318 241,337 255,356 256,357 156,357 155,356 142,337 129,318 116,299 103,280 90,261 90,252"/><circle cx="191.65" cy="155.3" r="42" fill="#0d9488"/></g></svg></span><span>made with <em>kumooo</em></span></a>`;
}

function unclaimedLine(slug: string): string {
  const lines = [
    "Nobody has published a site at this address yet.",
    "This slug is free. There is no page here.",
    "No site at this path. You can claim it from the dashboard.",
    "Nothing published here yet.",
    "This name is unused. Create a site with it if you want.",
    "No page, posts, or shop at this URL.",
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return lines[h % lines.length]!;
}

function unclaimedShell(slug: string, claimUrl: string): string {
  const line = unclaimedLine(slug);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(slug)} · unused · kumooo</title>
  <meta name="robots" content="noindex"/>
  <link rel="icon" href="https://kumooo.dev/favicon.svg"/>
  <style>
    :root{color-scheme:dark}
    *{box-sizing:border-box}
    body{
      margin:0;min-height:100vh;display:grid;place-items:center;
      font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
      background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(110,231,183,.12),transparent 55%),#0c0c0e;
      color:#f5f5f7;padding:2rem 1.25rem;
    }
    main{max-width:26rem;text-align:center}
    .mark{width:40px;height:40px;margin:0 auto 1rem;display:block}
    .brand{font-size:15px;font-weight:600;letter-spacing:-.02em;margin:0 0 1.5rem}
    .brand span{color:#6ee7b7}
    h1{font-size:1.65rem;letter-spacing:-.03em;margin:0 0 .75rem;font-weight:600}
    h1 code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#6ee7b7;font-size:.92em;font-weight:600}
    p{color:#a1a1a6;line-height:1.6;margin:0;font-size:15px}
    .actions{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center;margin-top:1.75rem}
    a.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:-.01em;padding:.7rem 1.2rem;border-radius:999px}
    a.btn-primary{background:#f5f5f7;color:#0c0c0e}
    a.btn-primary:hover{opacity:.92}
    a.btn-ghost{color:#f5f5f7;border:1px solid rgba(245,245,247,.14)}
    a.btn-ghost:hover{background:rgba(245,245,247,.06)}
  </style>
</head>
<body>
  <main>
    <img class="mark" src="https://kumooo.dev/brand-mark.png" width="40" height="40" alt=""/>
    <p class="brand">kumooo<span>.js</span></p>
    <h1>Nothing at <code>${escapeHtml(slug)}</code></h1>
    <p>${escapeHtml(line)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="${escapeAttr(claimUrl)}">Claim ${escapeHtml(slug)}</a>
      <a class="btn btn-ghost" href="https://kumooo.dev">kumooo.dev</a>
    </div>
  </main>
</body>
</html>`;
}

function hostedSkinLayoutCss(): string {
  return `*{box-sizing:border-box}html{--fg:var(--ink);--bg:var(--paper);--muted:var(--fog);--card:var(--surface);--line:color-mix(in srgb,var(--ink) 14%,transparent);--accent:var(--hot);--mint:var(--accent-ui)}a{color:inherit;text-decoration:none}.wrap{max-width:720px;margin:0 auto;padding:1.25rem}.wrap-wide{max-width:64rem}.skin-btn{display:inline-flex;align-items:center;justify-content:center;padding:.45rem .75rem;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none}.skin-masthead-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;max-width:64rem;margin:0 auto;padding:.75rem 1.25rem}.skin-masthead-nav{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}.skin-brand{text-decoration:none;color:inherit}.skin-post-list{list-style:none;padding:0;margin:1.5rem 0;display:grid;gap:1rem}.skin-post-list .skin-card{display:block;padding:1.25rem;text-decoration:none}.skin-post-list .skin-heading{margin:.75rem 0 .35rem}.skin-product-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-top:1.5rem}.skin-product-grid .skin-card{display:flex;flex-direction:column;text-decoration:none;overflow:hidden}.skin-product-grid .skin-card img{width:100%;aspect-ratio:4/5;object-fit:cover;background:var(--line)}.skin-card-body{display:flex;flex-direction:column;gap:.35rem;padding:1rem}.skin-price{font-weight:700;color:var(--hot)}.hero-img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--skin-radius-sm,10px);background:var(--line);margin-bottom:1rem}.prose{line-height:1.65;white-space:pre-wrap}.skin-heading-sm{font-size:1.15rem}.skin-heading-lg{font-size:clamp(2rem,4vw,2.75rem)}.font-display.skin-title{font-size:clamp(2.5rem,6vw,4.5rem);line-height:.95;margin:.4rem 0 1rem}.kumooo-credit{position:fixed;right:1rem;bottom:1rem;z-index:40;display:inline-flex;align-items:center;gap:.55rem;padding:.55rem .85rem .55rem .6rem;border-radius:999px;background:rgba(12,12,14,.88);border:1px solid rgba(245,245,247,.14);color:#f5f5f7;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:-.02em;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 10px 30px rgba(0,0,0,.25)}.kumooo-credit em{font-style:normal;color:#0d9488}.kumooo-credit-mark{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:7px;background:#0c0c0e;border:1px solid rgba(245,245,247,.12);flex-shrink:0}.kumooo-credit:hover{opacity:.95}@media(max-width:520px){.kumooo-credit{right:.75rem;bottom:.75rem;font-size:11px}}`;
}

function css(accent: string, bgOverride = "", fgOverride = "", fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"): string {
  const bgLight = bgOverride || "#f5f5f7";
  const fgLight = fgOverride || "#1d1d1f";
  const bgDark = bgOverride || "#0c0c0e";
  const fgDark = fgOverride || "#f5f5f7";
  const mutedLight = fgOverride
    ? `color-mix(in srgb, ${fgOverride} 62%, transparent)`
    : "#6e6e73";
  const mutedDark = fgOverride
    ? `color-mix(in srgb, ${fgOverride} 62%, transparent)`
    : "#a1a1a6";
  const lineLight = fgOverride
    ? `color-mix(in srgb, ${fgOverride} 14%, transparent)`
    : "rgba(29,29,31,.12)";
  const lineDark = fgOverride
    ? `color-mix(in srgb, ${fgOverride} 14%, transparent)`
    : "rgba(245,245,247,.12)";
  const lockScheme = bgOverride || fgOverride ? "color-scheme:only light;" : "color-scheme:light dark;";
  return `:root{${lockScheme}--bg:${bgLight};--fg:${fgLight};--muted:${mutedLight};--card:${bgOverride ? `color-mix(in srgb, ${bgOverride} 92%, ${fgOverride || "#fff"} 8%)` : "#fff"};--line:${lineLight};--accent:${accent};--mint:${accent};--radius:14px;--font-sans:${fontFamily}}html[data-skin=y2k]{--accent:${accent}}html[data-skin=glass]{--accent:${accent}}html[data-skin=kumooo]{--accent:${accent}}@media(prefers-color-scheme:dark){:root{--bg:${bgDark};--fg:${fgDark};--muted:${mutedDark};--card:${bgOverride ? `color-mix(in srgb, ${bgOverride} 92%, ${fgOverride || "#fff"} 8%)` : "#161618"};--line:${lineDark}}}*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:var(--font-sans);background:radial-gradient(900px 420px at 50% -10%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 55%),var(--bg);color:var(--fg)}a{color:inherit}.wrap{max-width:720px;margin:0 auto;padding:1.25rem}.hero{padding-top:4rem}.badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}.muted{color:var(--muted);line-height:1.55}h1{letter-spacing:-.03em;font-size:clamp(2rem,5vw,3rem);margin:.4rem 0 1rem}.btn{display:inline-flex;align-items:center;justify-content:center;padding:.7rem 1.1rem;border-radius:999px;background:var(--fg);color:var(--bg);text-decoration:none;font-weight:600;font-size:14px}.mast{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--card) 85%,transparent);backdrop-filter:blur(10px)}.row{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.brand{font-weight:700;text-decoration:none;letter-spacing:-.02em}.nav{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}.ghost{font-size:13px;color:var(--muted);text-decoration:none}.list{list-style:none;padding:0;margin:1.5rem 0;display:grid;gap:1rem}.list li{border:1px solid var(--line);border-radius:var(--radius);padding:1rem;background:var(--card)}.list a{text-decoration:none}.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-top:1.5rem}.card{display:flex;flex-direction:column;gap:.35rem;border:1px solid var(--line);border-radius:var(--radius);padding:1rem;background:var(--card);text-decoration:none}.card img,.hero-img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:var(--line)}.price{font-weight:700;color:var(--accent)}.prose{line-height:1.65;white-space:pre-wrap}.kumooo-credit{position:fixed;right:1rem;bottom:1rem;z-index:40;display:inline-flex;align-items:center;gap:.55rem;padding:.55rem .85rem .55rem .6rem;border-radius:999px;background:rgba(12,12,14,.88);border:1px solid rgba(245,245,247,.14);color:#f5f5f7;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:-.02em;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 10px 30px rgba(0,0,0,.25)}.kumooo-credit em{font-style:normal;color:#0d9488}.kumooo-credit-mark{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:7px;background:#0c0c0e;border:1px solid rgba(245,245,247,.12);flex-shrink:0}.kumooo-credit:hover{opacity:.95}@media(max-width:520px){.kumooo-credit{right:.75rem;bottom:.75rem;font-size:11px}}`;
}

function makeHtmlResponder(env: Env) {
  const api = (env.API_ORIGIN || "https://api.kumooo.dev").replace(/\/$/, "");
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    `connect-src 'self' ${api}`,
    [
      "frame-src",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://player.vimeo.com",
      "https://www.loom.com",
      "https://www.cal.com",
      "https://cal.com",
      "https://calendly.com",
      "https://www.calendly.com",
      "https://maps.google.com",
      "https://www.google.com",
      "https://www.openstreetmap.org",
      "https://openstreetmap.org",
      "https://codepen.io",
      "https://codesandbox.io",
      "https://stackblitz.com",
      "https://www.figma.com",
      "https://open.spotify.com",
    ].join(" "),
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return function html(body: string, status = 200): Response {
    return new Response(body, {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
        "content-security-policy": csp,
      },
    });
  };
}
