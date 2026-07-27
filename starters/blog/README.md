# Blog starter

kumooo.js blog kit with posts, comments, admin, and shared skins.

```bash
pnpm install
pnpm --filter @kumooo/starter-blog dev
```

Demo: https://blog.kumooo.site - Admin `admin` / `admin`. Content resets daily at 00:00 UTC.

## Skin (customer deploy)

Live demos keep the onsite SkinPicker. For a locked site skin from the dashboard:

```bash
NEXT_PUBLIC_SITE_SLUG=your-slug
# or
NEXT_PUBLIC_SITE_SKIN=y2k
```

Mount `<LockedSkinSync />` from `@kumooo/theme-packs` in the root layout and omit `<SkinPicker />`. Boot with `themeBootScript("y2k", { preferStored: false })`.
