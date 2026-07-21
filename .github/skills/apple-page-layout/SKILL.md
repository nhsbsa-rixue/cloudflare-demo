---
name: apple-page-layout
description: 'Generate consistent Svelte page layouts matching the Apple design system (DESIGN.md). Use when: creating new pages, building page templates, scaffolding routes, page layout, new route, consistent UI, Apple style page, product tile page, form page, grid page, landing page.'
argument-hint: 'Describe the page purpose (e.g., "product listing grid" or "upload form")'
---

# Apple Design Page Layout Generator

Generate consistent Svelte 5 page layouts for the frontend project (`modules/frontend/`) that follow the Apple design system defined in `.github/prompts/DESIGN.md`, using the existing shadcn-style component library.

## When to Use

- Creating a new route/page in `modules/frontend/src/routes/`
- Scaffolding a page layout that must match the Apple aesthetic
- Ensuring visual consistency across all pages

## Available Components

All components live in `$lib/components/ui/` and are re-exported from `$lib/components/ui/index.ts`:

| Component | Import | Variants |
|-----------|--------|----------|
| `Button` | `$lib/components/ui/button` | `variant`: primary, secondary, dark, ghost · `size`: sm, md, lg, pill |
| `Card` | `$lib/components/ui/card` | `variant`: utility, tile · `tileMode`: light, parchment, dark |
| `CardContent`, `CardHeader`, `CardFooter` | `$lib/components/ui/card` | — |
| `Badge` | `$lib/components/ui/badge` | `variant`: default, pearl · `selected`: boolean |
| `Input` | `$lib/components/ui/input` | Standard text input with label |
| `Heading` | `$lib/components/ui/typography` | `level`: 1–6 |
| `Lead` | `$lib/components/ui/typography` | Lead paragraph (24px / light) |
| `Text` | `$lib/components/ui/typography` | `size`: sm, base, lg |
| `Caption` | `$lib/components/ui/typography` | `size`: sm, base |
| `GlobalNav` | `$lib/components/ui/nav` | Black nav bar (in layout, not pages) |
| `SubNav` | `$lib/components/ui/nav` | Frosted sub-nav with optional `cta` snippet |

## Design Tokens (Tailwind v4)

Tokens are defined in `modules/frontend/src/app.css` via `@theme`. Key classes:

- **Colors**: `bg-canvas`, `bg-canvas-parchment`, `bg-surface-tile-1`, `bg-surface-pearl`, `text-ink`, `text-body-on-dark`, `text-primary`, `text-ink-muted-48`
- **Radius**: `rounded-sm` (8px), `rounded-md` (11px), `rounded-lg` (18px), `rounded-pill` (9999px)
- **Spacing**: `p-spacing-section` (80px), `p-6` (24px), `gap-6`
- **Shadow**: `shadow-product` (only on product imagery)
- **Font**: `font-display` (headlines), `font-sans` (body)

## Page Layout Templates

### Template 1: Hero Landing Page

Full-bleed tiles alternating light/dark, centered content, photography-first.

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Card } from "$lib/components/ui/card/index.js";
  import { Heading, Lead } from "$lib/components/ui/typography/index.js";
</script>

<!-- Hero tile (light) -->
<Card variant="tile" tileMode="light">
  <div class="mx-auto max-w-4xl text-center flex flex-col items-center gap-4">
    <Heading level={1}>Product Name</Heading>
    <Lead>One-line tagline describing the product.</Lead>
    <div class="flex gap-4 mt-4">
      <Button variant="primary" size="pill" label="Learn more" />
      <Button variant="ghost" size="pill" label="Buy" />
    </div>
    <!-- Product image with the single system shadow -->
    <img src="/product.webp" alt="Product" class="mt-8 shadow-product" />
  </div>
</Card>

<!-- Dark tile -->
<Card variant="tile" tileMode="dark">
  <div class="mx-auto max-w-4xl text-center flex flex-col items-center gap-4">
    <Heading level={2} class="text-body-on-dark">Feature Headline</Heading>
    <Lead class="text-body-muted">Supporting description.</Lead>
    <Button variant="primary" size="pill" label="Learn more" />
  </div>
</Card>

<!-- Parchment tile -->
<Card variant="tile" tileMode="parchment">
  <div class="mx-auto max-w-4xl text-center flex flex-col items-center gap-4">
    <Heading level={2}>Another Section</Heading>
    <Lead>Description text.</Lead>
  </div>
</Card>
```

### Template 2: Form / Utility Page

Centered utility card on a parchment background for forms, uploads, settings.

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Card, CardContent, CardHeader } from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Heading, Text } from "$lib/components/ui/typography/index.js";
</script>

<main class="min-h-screen bg-canvas-parchment flex items-start justify-center px-6 py-spacing-section">
  <Card variant="utility" class="w-full max-w-lg">
    <CardHeader>
      <Heading level={3}>Form Title</Heading>
      <Text size="sm" class="text-ink-muted-48 mt-1">Brief description of what this form does.</Text>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <Input label="Field Name" placeholder="Enter value" name="field" required />
      <Input label="Another Field" placeholder="Enter value" name="field2" />
      <Button variant="primary" size="pill" type="submit" label="Submit" />
    </CardContent>
  </Card>
</main>
```

### Template 3: Grid / List Page

Multi-column utility card grid for store, product listing, or dashboard views.

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Card, CardContent } from "$lib/components/ui/card/index.js";
  import { Heading, Text, Caption } from "$lib/components/ui/typography/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  // Example data
  const items = [
    { id: 1, title: "Item One", description: "Brief description", price: "$99" },
    { id: 2, title: "Item Two", description: "Brief description", price: "$149" },
    { id: 3, title: "Item Three", description: "Brief description", price: "$199" },
  ];
</script>

<main class="min-h-screen bg-canvas-parchment">
  <!-- Page header -->
  <div class="px-6 py-12 text-center">
    <Heading level={2}>Collection Title</Heading>
    <Text class="mt-2 text-ink-muted-48">Browse all items.</Text>
  </div>

  <!-- Grid -->
  <div class="mx-auto max-w-6xl px-6 pb-spacing-section grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each items as item (item.id)}
      <Card variant="utility">
        <CardContent class="flex flex-col gap-3">
          <!-- Product image slot -->
          <div class="aspect-square rounded-sm bg-canvas-parchment flex items-center justify-center">
            <span class="text-ink-muted-48 text-sm">Image</span>
          </div>
          <Heading level={5} class="text-base font-semibold">{item.title}</Heading>
          <Text size="sm">{item.description}</Text>
          <Caption>{item.price}</Caption>
          <Button variant="primary" size="sm" label="Buy" class="mt-auto" />
        </CardContent>
      </Card>
    {/each}
  </div>
</main>
```

## Rules

1. **Always import from `$lib/components/ui/<component>/index.js`** — not from the `.svelte` file directly.
2. **Use `Card variant="tile"`** for full-bleed sections; **`Card variant="utility"`** for contained cards.
3. **Alternate tile modes** for rhythm: `light` → `dark` → `parchment` → `dark`. Never stack two identical surface colors.
4. **Only use `shadow-product`** on product imagery — never on cards, buttons, or text.
5. **Heading + Lead + Button(s)** is the standard tile content stack. Always centered with `text-center` and `flex flex-col items-center`.
6. **Button primary uses `size="pill"`** for main CTAs. Use `size="sm"` for utility/card buttons.
7. **`bg-canvas-parchment`** is the default page background for non-tile pages (forms, grids). Never use raw white as the page bg.
8. **No decorative gradients or extra shadows.** Elevation comes only from surface color change or backdrop-blur.
9. **Max content width**: `max-w-4xl` (text-heavy / tiles), `max-w-6xl` (grids), full-bleed for tile cards.
10. **Typography hierarchy**: `Heading level={1}` for hero → `Heading level={2}` for section → `Heading level={3}` for card titles → `Text` for body → `Caption` for metadata.
11. **Spacing**: Tiles use `py-spacing-section` (80px). Grid gaps use `gap-6`. Card internal padding is `p-6`.
12. **Dark tile text**: Use `class="text-body-on-dark"` on Heading, and `class="text-body-muted"` on Lead/Text.
13. **Active state**: Buttons already have `active:scale-95` built in — do not add custom press states.
14. **Responsive grid columns**: 1-col → 2-col (sm) → 3-col (lg) → 4-col (xl). Follow the Apple breakpoint pattern.
15. **Form pages** wrap content in `<main class="min-h-screen bg-canvas-parchment flex items-start justify-center px-6 py-spacing-section">`.

## File Conventions

- New pages go in `modules/frontend/src/routes/<route>/+page.svelte`
- Server logic in `+page.server.ts` (SvelteKit form actions / load functions)
- Use Svelte 5 runes (`$props`, `$state`, `$derived`) — no legacy `export let`
- Type imports from `./$types` for `PageData` and `ActionData`

## Anti-patterns

- **Don't** use inline hex colors — always use the Tailwind token classes
- **Don't** add `rounded-*` to tile Cards — tiles are full-bleed with `rounded-none`
- **Don't** mix font families manually — `font-display` is for headings only, body is `font-sans` (default)
- **Don't** use weight 500 — the Apple ladder is 300/400/600/700
- **Don't** add borders to tile sections — color change IS the divider
- **Don't** use `text-primary-on-dark` (#2997ff) on light surfaces — it's dark-tile-only
