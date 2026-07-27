# Shop starter

kumooo.js shop kit with live catalog, fake bag, and demo admin.

```bash
pnpm install
pnpm --filter @kumooo/starter-shop dev
```

Demo: https://shop.kumooo.site - Admin `admin` / `admin`. Products reset daily at 00:00 UTC.

## Skin (customer deploy)

Live demos keep the onsite SkinPicker. For a locked site skin from the dashboard:

```bash
NEXT_PUBLIC_SITE_SLUG=your-slug
# or
NEXT_PUBLIC_SITE_SKIN=kumooo
```

Mount `<LockedSkinSync />` from `@kumooo/theme-packs` in the root layout and omit `<SkinPicker />`. Boot with `themeBootScript("kumooo", { preferStored: false })`.
