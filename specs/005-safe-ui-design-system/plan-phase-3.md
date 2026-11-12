# Plan: Safe UI, Phase 3 (docs site and registry)

Spec: [spec.md](spec.md). Phase 3 per the spec's Rollout section: scaffold `apps/design-system`, a static docs site with Foundations and every component, plus a shadcn registry built from `packages/ui/src`. Builds on [plan-phase-0.md](plan-phase-0.md) and [plan-phase-1.md](plan-phase-1.md), including their Implementation notes and Follow-ups.

## Goal

When this phase is done, the design system is ready to test locally:

- `yarn workspace @safe-global/design-system build` writes a plain static site to `apps/design-system/out/`. It has no host-specific files, and `basePath`/`assetPrefix` come from build variables.
- The site has Getting started pages (Introduction, Installation, Theming, Dark mode, Changelog), Foundations (Colors, Typography, Spacing, Radius, Icons), Utilities (`cn`, hooks, `ShadcnProvider`) and **one page for each of the 52 component exports**. Each component page has a live preview, the code, install steps, props generated from TypeScript, accessibility notes and Do/Don't guidance taken from the ESLint rules.
- Previews render the existing `packages/ui` stories. A story a designer adds shows up in the docs without any docs edit (R6, R17).
- `out/r/*.json` is a shadcn registry. It has one `registry:ui` item per component, `registry:lib`/`registry:hook` items for `utils` and the hooks, and a `registry:theme` item built from the generated tokens. Running `npx shadcn add @safe/<item>` against a locally served `out/` works in a fresh Vite + Tailwind v4 app (SC4, local).
- Tests fail when a component export has no page, no preview or no registry item, or when the committed `registry.json` is stale.

## Scope

- The new workspace `apps/design-system` (`@safe-global/design-system`, private). It uses Next 16 static export, Fumadocs (core, ui, mdx) and Tailwind v4. It consumes `@safe-global/ui` the way an outside app does: `@import 'tailwindcss'`, `@import '@safe-global/ui/styles.css'` and an `@source` line pointing at the installed package. The default styles are unscoped, with no `.shadcn-scope` and no `ShadcnProvider`.
- Build-time generators (no committed output except `registry.json`):
  - a story index and per-component client preview modules
  - story source for the Code tab
  - props from `react-docgen-typescript`
  - token tables parsed from `tokens.css` / `tailwind-theme.css`
  - Do/Don't rules parsed from `packages/ui/eslint/design-system.mjs`
  - the lucide icons the package uses
- The registry: `registry.json` (generated, committed), the transformed registry sources (generated, gitignored), `shadcn build` → `public/r/`, and a validator.
- In `packages/ui` only: an `./eslint` export key (R1), which the docs site imports as a consumer would. No component source changes.
- Root wiring: `yarn.lock`, a workspace-level `turbo.json`, `knip.json`, `.prettierignore`, the root `AGENTS.md` table, a new non-required CI workflow for this app only, and `apps/design-system/{AGENTS,CLAUDE,README}.md`.
- Local validation: a Playwright crawl of `out/` (404s, console errors, light/dark and mobile screenshots), an SC4 smoke test in a throwaway Vite app in the scratchpad, and a `basePath` build.

## Out of scope (and where it goes)

**Phase 2 is skipped by user decision**, so the wallet does not migrate in this effort. That means:

- Nothing in `apps/web`, `apps/web-tanstack` or `packages/views` changes, including their `package.json` files.
- The `views` re-exports stay. `apps/web/components.json` still points at `views`. The wallet keeps `packages/views/eslint-design-system.mjs`, which re-exports from `../ui/eslint/design-system.mjs`.
- US3 and SC2 stay where Phase 1 left them. The wallet looks the same because it isn't touched. A guard command in Verification proves the diff is empty.
- The docs site never imports `@safe-global/views`, and it reads the wallet only for usage counts (see D11).

| Item                                                                                                                                                             | Phase                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Wallet import codemod, removing the `views` re-exports, wallet lint switching to `@safe-global/ui/eslint`, Chromatic for the ui Storybook, CODEOWNERS (R14, R17) | 2 (skipped for now, user does it later)  |
| `packages/ui/components.json` (see D13)                                                                                                                          | follow-up                                |
| `'use client'` banners in the npm package, the `dist` build, `.d.ts`, publishing, changesets, a real changelog                                                   | 4 (outside this effort)                  |
| Hosting, domain, deploys and preview deploys (R13 deploy part), the public registry URL                                                                          | 4 (outside this effort)                  |
| Blocks/patterns pages (R9 "Later")                                                                                                                               | later                                    |
| Font packaging in `@safe-global/ui` (Phase 1 D8 follow-up)                                                                                                       | follow-up (the docs site self-hosts, D9) |
| MCP server for agents (R12 optional)                                                                                                                             | later (`llms.txt` is in scope)           |
| Any change to a token value, a component or a story's rendering                                                                                                  | never in this phase                      |

## Decisions

**D1. Dependencies and exact versions.** Every new dependency must be on registry.npmjs.org and older than the 7-day age gate (`npmMinimalAgeGate: 10080`). Today is 2026-11-11, so the cutoff is 2026-11-04. Lockfile versions are reused wherever they exist.

| Package                                 | Range in `apps/design-system/package.json`                                                                                                      | Resolves to | Why this version                                                                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`                                  | `patch:next@npm%3A16.4.2#~/.yarn/patches/next-npm-16.4.2-6ca9d0fedd.patch`                                                                      | 16.4.2      | The same descriptor as `apps/web`, so there is one hoisted `next`. With two copies, `fumadocs-core`'s `next` peer could resolve to a different instance (see risk 1). The patch only adds an SRI lookup to the Pages Router route loader, which does nothing here |
| `react`, `react-dom`                    | `19.2.0`                                                                                                                                        | 19.2.0      | `yarn constraints` (`DEPS_TO_CHECK`)                                                                                                                                                                                                                              |
| `fumadocs-core`                         | `16.17.10` (exact)                                                                                                                              | 16.17.10    | Newest before the cutoff (2026-11-02). 16.18.x and 16.19.0 are too new. Peers: `next 16.x`, `react ^19.2`, `zod 4.x`                                                                                                                                              |
| `fumadocs-ui`                           | `16.17.10` (exact)                                                                                                                              | 16.17.10    | Its peer pins `fumadocs-core` to exactly `16.17.10`. It brings `next-themes ^0.4.6` (already in the lockfile) and its own `lucide-react ^1.x`, which sits apart from the package's `^0.563.0`                                                                     |
| `fumadocs-mdx`                          | `15.4.10` (exact)                                                                                                                               | 15.4.10     | Newest before the cutoff (2026-10-23). Peer `fumadocs-core ^16.17.8`                                                                                                                                                                                              |
| `zod`                                   | `^4.1.11`                                                                                                                                       | 4.3.5       | `fumadocs-core` peer, and needed for the frontmatter schema. This range is already in the lockfile                                                                                                                                                                |
| `@types/mdx`                            | `^2.0.13`                                                                                                                                       | lockfile    | `fumadocs-ui`/`fumadocs-mdx` peer                                                                                                                                                                                                                                 |
| `tailwindcss`, `@tailwindcss/postcss`   | `^4.1.18`                                                                                                                                       | 4.2.1       | Same as `apps/web`                                                                                                                                                                                                                                                |
| `postcss`                               | `^8.5.18`                                                                                                                                       | 8.5.23      | Root resolution                                                                                                                                                                                                                                                   |
| `@storybook/react`                      | `^10.6.5`                                                                                                                                       | 10.6.5      | `composeStories` for the previews (D4)                                                                                                                                                                                                                            |
| `shadcn` (dev)                          | `^3.7.0`                                                                                                                                        | 3.8.5       | The same range as `packages/ui`, for `shadcn build` and `shadcn/schema`. The SC4 smoke test also runs the consumer side with `shadcn@4.23.0` (2026-10-27, newest before the cutoff)                                                                               |
| `react-docgen-typescript` (dev)         | `2.2.2` (exact)                                                                                                                                 | 2.2.2       | Already in the lockfile (through Storybook). It runs on the workspace TypeScript 5.9 (D6)                                                                                                                                                                         |
| `@safe-global/ui`                       | `workspace:^`                                                                                                                                   | —           | The package being documented                                                                                                                                                                                                                                      |
| `@playwright/test`, `http-server` (dev) | `^1.64.1`, `^14.1.1`                                                                                                                            | lockfile    | Crawl and local serve                                                                                                                                                                                                                                             |
| dev tooling                             | `typescript ~5.9.2`, `eslint ^9.39.4`, `typescript-eslint ^8.72.1`, `@types/react ~19.2.10`, `@types/react-dom ~19.2.0`, `@types/node ^22.13.1` | lockfile    | constraints                                                                                                                                                                                                                                                       |

Rejected:

- `fumadocs-typescript` 5.6.0 (`AutoTypeTable`). It depends on `typescript@7.1.0-beta` as a regular dependency, which would add a third TypeScript to the tree, and it would type every inherited DOM attribute. See D6.
- Turbopack. See D2.

Transitive dependencies new to the lockfile (shiki 4, motion, `@radix-ui/*` from `fumadocs-ui`) must also pass the age gate. If `yarn install` refuses one, pin it through `resolutions` to the newest version that passes, and record the pin.

**D2. Next config: static export, webpack, host-agnostic.** `apps/design-system/next.config.mjs`:

- `output: 'export'`, `trailingSlash: true` (every route is `…/index.html`, so any static host serves it without rewrites), `images: { unoptimized: true }`, `reactStrictMode: true`.
- `basePath: BASE_PATH || undefined` and `assetPrefix: ASSET_PREFIX || BASE_PATH || undefined`. `BASE_PATH` comes from `NEXT_PUBLIC_BASE_PATH`, normalised to `''` or `/segment` with no trailing slash. `ASSET_PREFIX` comes from `NEXT_PUBLIC_ASSET_PREFIX`. Both default to empty, so `out/` works at a domain root.
- `transpilePackages: ['@safe-global/ui']`. The package exports raw `.tsx`, the same way `apps/web` consumes it.
- `webpack(config)` aliases `@ui-stories` to `<dir of require.resolve('@safe-global/ui/package.json')>/src/components/stories`. That path is inside the package directory, so `transpilePackages` covers it. The stories' relative imports (`../button`) resolve to the same real files as `@safe-global/ui/button`, so there's one module instance. The fallback, if the alias isn't transpiled, is a `"./stories/*"` exports key in `packages/ui`, recorded as a deviation.
- `createMDX()` from `fumadocs-mdx/next` wraps the config.
- Build and dev run with `--webpack`, like the other Next app in the repo. Turbopack would need `turbopack.root` for the out-of-app package sources, and it ignores `webpack()` config, so the alias above wouldn't apply.
- No `vercel.json`, `netlify.toml`, `_redirects`, `CNAME`, `.nojekyll` or `headers` config. Acceptance check 10 proves it.

**D3. Routes and layouts.** The docs live at the site root (`/`, `/installation/`, `/components/button/`), not under `/docs`. A static export has no server-side redirect, so a root redirect page would only add a hop. There are two root layouts (route groups):

- `src/app/(docs)/layout.tsx`: Fumadocs `RootProvider` and `DocsLayout`. CSS: `tailwindcss`, `fumadocs-ui/css/neutral.css`, `fumadocs-ui/css/preset.css`, `@safe-global/ui/styles.css`, `@source` for the package and `src/`, and `fonts.css`. `--color-fd-primary` is mapped to `var(--primary)` so the chrome carries the brand. `[[...slug]]/page.tsx` sets `generateStaticParams` from `source.generateParams()` and `dynamicParams = false`.
- `src/app/(preview)/preview/[component]/[story]/layout.tsx` and `page.tsx`: a bare document that loads **only** the consumer CSS (`preview.css`: `@import 'tailwindcss'; @import '@safe-global/ui/styles.css'; @source '<ui package>/src';` plus `fonts.css`). No Fumadocs CSS reaches a preview, so a preview shows exactly what a consumer gets. `generateStaticParams` comes from the generated story index.
- `src/app/api/search/route.ts`: Fumadocs static search (`createFromSource(source)` → `staticGET`, `revalidate = false`). The client uses `search: { options: { type: 'static', api: withBasePath('/api/search') } }`. The exact API names are taken from the installed 16.17.10 typings.
- `src/app/llms.txt/route.ts` and `src/app/llms-full.txt/route.ts`: static `GET` handlers built from `source.getPages()` (R12, optional). They're dropped if Fumadocs' processed-markdown option isn't available in 15.4.10, and the PR says so.

**D4. Previews: stories in iframes, through `composeStories`.**

- **Why iframes.** Nine story files open on load (`defaultOpen` in dialog, alert-dialog, sheet, drawer, popover, hover-card, dropdown-menu, collapsible, sidebar), and `Sidebar` is `position: fixed; h-svh`. Inline, these would cover the docs page and trap focus. Fumadocs' `prose` and base styles would also bleed into inline previews. An iframe of the static `/preview/<component>/<story>/` page isolates position, focus, portals and CSS. It also makes previews screenshot-testable one by one.
- **Generated client modules.** `src/generated/previews/<component>.tsx` has `'use client'`, `import * as stories from '@ui-stories/<component>.stories'`, `composeStories(stories)` and a `Story({ name })` component. `src/generated/previews/index.ts` maps each component to `next/dynamic(() => import('./<component>'), { ssr: false })`. Previews render on the client only, because hooks like `useIsMobile` read `window`. Nothing is hand-written per component, so a new story file shows up after `generate`.
- **Default story.** The first exported story is the page's top preview, and the rest are Examples. A story tagged `docs-hidden` is skipped. This tag is new, it's added to no story in this phase, and it's documented in `packages/ui/AGENTS.md`.
- **Theme in previews.** An inline script in the preview layout sets `html.dark`, in this order of precedence: the `?theme=light|dark` query (used for screenshots), then `localStorage.theme` (the key `next-themes` writes; same origin, so readable), then `prefers-color-scheme`. A `storage` listener follows toggles made in the parent page.
- **Height.** The preview page posts `{ type: 'safe-ui-preview-height', height }` from a `ResizeObserver`, and the parent `StoryFrame` sets the iframe height. A per-component minimum height lives in `src/lib/preview-config.ts` (for example dialog, alert-dialog, sheet, drawer, sidebar, combobox, select and dropdown-menu at 480–640px), because portalled content doesn't add to document height. Iframes use `loading="lazy"`.
- **Code tab.** `src/scripts/stories.ts` parses each story file with the TypeScript 5.9 compiler API. For each exported story it emits:
  - the `render` function's returned JSX, printed from the source text
  - or, when there's no `render`, `<Meta.component {...args} />` synthesised from `meta.args` and `story.args`

  An import header is built from the identifiers used, with relative `../<name>` rewritten to `@safe-global/ui/<name>` and other module specifiers kept. The output goes to `src/generated/stories.json`. Server components highlight it with Fumadocs' `CodeBlock`, which includes the copy button (R12).

- **Fallback.** If `composeStories` can't be bundled for the browser, `Story` calls `story.render?.(args, ctx)` or `<meta.component {...args}/>` with the decorators applied by hand. Only `card` and `typography` declare decorators. This is recorded as a deviation.

**D5. Component pages: thin hand-maintained MDX over generated data.** Each `content/docs/components/<name>.mdx` has frontmatter (`title`, `description`, `component: <name>`) and a fixed body:

```mdx
<ComponentPreview component="button" /> {/* Preview / Code tabs, first story */}

## Installation

<ComponentInstall component="button" /> {/* npm import line, and `shadcn add @safe/button` with the registry setup */}

## Usage

<ComponentUsage component="button" />            {/* generated import + minimal snippet */}
<hand-written usage notes, 1–4 sentences>

## Examples

<ComponentExamples component="button" /> {/* every other story, each with Preview / Code tabs */}

## Props

<ComponentProps component="button" /> {/* one TypeTable per exported component */}

## Accessibility

<BaseUiReference component="button" />           {/* link to the Base UI page when the file imports @base-ui/react/<x> */}
<hand-written keyboard / ARIA notes>

## Do / Don't

<ComponentRules component="button" /> {/* from the ESLint rules, or nothing when no rule covers this file */}
```

- `src/scripts/scaffold-pages.ts` writes the skeleton for every component export that has no page and never overwrites one. Agents then write the description, usage notes and accessibility notes (G3).
- `content/docs/components/meta.json` lists pages alphabetically. The ten most-used components come first in the rollout order (D11), but they aren't pinned in navigation.
- `src/scripts/pages.test.ts` (SC3) fails when:
  - a `./<name>` key in `packages/ui/package.json` that points into `src/components/` has no page with `component: <name>`
  - a page names a component that doesn't exist
  - a component has no story file, or no story
  - a page leaves out one of the seven sections

**D6. Props from TypeScript with `react-docgen-typescript`.**

- `src/scripts/props.ts` runs `withCustomConfig('<ui>/tsconfig.json', { shouldExtractLiteralValuesFromEnum: true, shouldRemoveUndefinedFromOptional: true, savePropValueAsString: true, propFilter })` over every component file. It writes `src/generated/props/<component>.json`, keyed by each exported component's `displayName`.
- `propFilter` drops props declared only in `@types/react` (DOM and ARIA attributes), but keeps `className`, `children`, `render` and `asChild`. It keeps props declared in `packages/ui/src`, in `@base-ui/react` and in `class-variance-authority` (the `VariantProps` unions).
- Rendering uses Fumadocs' `TypeTable` (name, type, default, required, description from JSDoc). A note under each table says the component also accepts the props of the element or Base UI part it renders.
- `overlay.ts` exports a `cva` (`overlayVariants`), not a component. Its page shows the variant keys, which `props.ts` reads from the `cva` config with the TypeScript AST.
- Rationale: it runs on the workspace's TypeScript 5.9 and is already in the lockfile. It gives a deterministic JSON file per component that tests can assert on (`Button` has `variant` with the six literal values and `size` with ten).

**D7. Tokens and Foundations are generated from the CSS, not copied.** `src/scripts/tokens.ts` parses `@safe-global/ui/tokens.css` (`:root` and `.dark`) and the `@theme inline` block of `tailwind-theme.css` with `postcss` (both resolved through `require.resolve('@safe-global/ui/package.json')`). It writes `src/generated/tokens.json` as `{ name, light, dark, group, tailwind? }`. `group` comes from the name prefix:

- shadcn semantic colors (`--background`, `--primary`, …, `--sidebar-*`, `--chart-*`)
- palette (`--color-*`)
- spacing (`--space-*`)
- radius (`--radius*`)
- z-index (`--z-*`)
- other

`tailwind` is the utility the token maps to (`bg-primary` for `--color-primary: var(--primary)`).

The pages render it as follows:

- **Colors**: light and dark swatches side by side for each name, showing the variable name, the raw value, the resolved value (read in the browser with `getComputedStyle`) and the utility.
- **Spacing**: bars from `--space-*`.
- **Radius**: boxes from `--radius-*`.
- **Typography**: `--font-sans`, plus the `typography` component's variants from its props JSON and its story.
- **Icons**: every `lucide-react` name imported in `packages/ui/src/components`, collected into `src/generated/icons.json`, with the `ICON_STROKE` rule. "Any lucide icon" links to lucide.dev.
- **Theming**: the full variable table, how to override a variable, `scoped.css` versus `styles.css`, and the `@safe/theme` registry item.

So no hex value lives in the docs app (acceptance check 8). Fonts: D9.

**D8. Do/Don't from the ESLint rules.**

- `packages/ui/package.json` gains `"./eslint": "./eslint/design-system.mjs"`, the R1 key that Phase 2 would have added. Only the key is new. `package-exports.test.ts` already checks that it points at a file. The `views` re-export and the wallet's lint wiring don't change.
- `src/scripts/rules.ts` imports `designSystemSyntaxRules` from `@safe-global/ui/eslint`. From each `selector` it takes the element name (`name.name='X'`) and the regex alternatives (`h-|px-|…` → `h-*`, `px-*`, …). It splits `message` at the first `—`: the left part is the Don't, the right part the Do.
- Rules are mapped to a component page when the element is a named export of that component file. That covers Button, SelectTrigger, the Card parts, Input, the InputGroup parts, SearchInput, TabsList/TabsTrigger, Badge, Chip, and the Dialog/Sheet/Drawer parts. Wallet-only presets (`SubmitButton`, `ActionButton`, `SettingsCard`, `SpaceSettingsSection`, `TxCard`, `SearchField`, `NumberField`, `NameInput`) aren't ui exports, so they're skipped.
- Each card shows a Don't code sample generated from the first two class alternatives (`<Button className="h-9 px-4">`), the Do text and the escape hatch. Pages with no rule get the generic "className is layout-only" note only when the component has `variant`/`size` props.
- `rules.test.ts` fails if a selector can't be parsed. That catches a future rule written in a new shape.

**D9. Fonts.** `@safe-global/ui` doesn't ship DM Sans (Phase 1 D8 follow-up), and `--font-sans` is `'DM Sans', sans-serif`. The docs site copies the three `woff2` files from `apps/web/public/fonts/` into `apps/design-system/src/app/fonts/`. This is a read-only copy: `apps/web` doesn't change. `fonts.css` declares them with relative `url()`, so Next hashes them under `_next/static/media` and `basePath`/`assetPrefix` apply. Both layouts import it. The Installation page says the package expects the app to load DM Sans. Packaging fonts is a user decision (Decisions needing input).

**D10. Registry: generated from `packages/ui/src`, built with `shadcn build`.** `src/scripts/registry.ts`:

1. Reads `packages/ui/package.json` `exports` and the dependency ranges.
2. For each `./<name>` → `./src/components/<name>.ts(x)`, it parses imports with the TypeScript AST:
   - `./x` becomes the `registryDependencies` entry `@safe/x`.
   - `../provider` becomes `@safe/provider`.
   - `../lib/utils` becomes `@safe/utils`.
   - `../hooks/use-mobile` becomes `@safe/use-mobile`.
   - `./table.module.css` becomes a second file in the same item.
   - Bare specifiers become `dependencies`, with the package name (subpaths dropped, so `@base-ui/react/dialog` → `@base-ui/react`) and the range from `packages/ui` (`@base-ui/react@^1.1.0`). `react` is excluded.
3. Writes a transformed copy to `apps/design-system/registry/safe/{ui,lib,hooks}/<file>` (gitignored), rewriting:
   - `./x` → `@/registry/safe/ui/x`
   - `../lib/utils` → `@/registry/safe/lib/utils`
   - `../hooks/x` → `@/registry/safe/hooks/x`
   - `../provider` → `@/registry/safe/ui/provider`

   On `shadcn add`, the CLI rewrites `@/registry/<style>/{ui,lib,hooks}/…` to the consumer's aliases. It also prepends `'use client'` to `ui`/`hook` files that don't start with it. That's needed by Next App Router consumers, and the CLI strips it when the consumer has `rsc: false`. The npm package's own banners stay Phase 4.

4. Writes `apps/design-system/registry.json`, sorted and stable, and **committed**. Its `$schema` is `https://ui.shadcn.com/schema/registry.json` and its `name` is `safe`. `homepage` is the GitHub tree URL of `apps/design-system`, which names no host. Items:
   - every component as `registry:ui`
   - `provider` as `registry:ui`
   - `utils` as `registry:lib`
   - `use-mobile` and `use-tablet` as `registry:hook`
   - `theme` as `registry:theme`. Its `cssVars.light`/`cssVars.dark` hold every declaration of `tokens.css` `:root`/`.dark`. `cssVars.theme` holds the `@theme inline` block of `tailwind-theme.css`. `css` holds the `@custom-variant dark`, the `styles.css` base layer and the two `@import`s (`tw-animate-css`, `shadcn/tailwind.css`). `dependencies` are `tw-animate-css` and `shadcn` at the `packages/ui` ranges.
   - `table.module.css` is a `registry:file` with `target: "components/ui/table.module.css"`. If the smoke test shows the CLI doesn't place it next to `table.tsx` under a non-default `ui` alias, the Table page documents the manual step and the PR records it.
5. `registryDependencies` use the namespace form (`@safe/button`), never a URL, so the build names no host.

Then `shadcn build registry.json --output public/r`. Next copies `public/` into `out/`, so the registry is served at `<origin><basePath>/r/<name>.json`. `src/scripts/check-registry.ts` parses every `public/r/*.json` with `registryItemSchema` from `shadcn/schema`. It asserts:

- one file per item
- `files[].content` is non-empty
- no relative import leaving the item (`../`) remains in any `content`
- every `registryDependencies` entry names an item

`registry.test.ts` (unit) asserts:

- `generateRegistry()` deep-equals the committed `registry.json`, the drift guard for US4.3
- every component export has an item
- the theme's `cssVars` contain exactly the `tokens.css` declarations

**D11. Rollout and the "10 most-used first" rule.** All 52 component pages are delivered (SC3 = 100%), because the pages are templated (D5) and the per-page hand work is small. The rule shapes the order instead. Usage counts, taken read-only from `apps/web`, `apps/web-tanstack` and `packages/views` imports, give the first wave: typography (504), button (348), tooltip (209), alert (97), skeleton (80), separator (70), spinner (66), card (62), dialog (51), badge (47). Wave 1 (G3a) proves the template end to end with a full build before waves 2a–2c fill the rest.

**D12. Registry URL and env, host-agnostic.** `src/lib/env.ts` reads:

- `NEXT_PUBLIC_BASE_PATH` (default `''`)
- `NEXT_PUBLIC_ASSET_PREFIX` (default: the base path)
- `NEXT_PUBLIC_SITE_URL` (optional; used for `metadataBase` and absolute links in `llms.txt`)
- `NEXT_PUBLIC_REGISTRY_URL` (optional, a template containing `{name}`)

The Installation page and every `ComponentInstall` show the `components.json` snippet `"registries": { "@safe": "<url>" }`:

- the build-time `NEXT_PUBLIC_REGISTRY_URL` when it's set
- otherwise the client-side `${location.origin}${basePath}/r/{name}.json`, so the snippet is right on whatever host serves `out/`
- with the static HTML placeholder `https://<docs-host>${basePath}/r/{name}.json` before hydration

`env.test.ts` covers the normalisation and the three cases. No `.env` file is created or edited; the variables are documented in the app README and AGENTS.md.

**D13. `packages/ui/components.json` is not added.** The `shadcn` CLI resolves aliases through tsconfig `paths`, and `packages/ui` deliberately has none: its imports must stay relative for consumers that compile the source. A `components.json` there would write alias imports that break `relative-imports.test.ts`. The docs site and the registry don't need it. Follow-up: decide on an alias-free way to add upstream components, or keep the current flow (`apps/web` CLI, then move the file).

**D14. Scripts, generation and test runner.** Generators are TypeScript run by Node's built-in type stripping. The repo's `.nvmrc` is 24, and the container runs 22.23, which strips types without a flag. So there's no `tsx` dependency. The app sets `"engines": { "node": ">=22.18.0" }`. Generators use `import type` and explicit `.ts` relative specifiers, and the tsconfig sets `allowImportingTsExtensions` with `noEmit`. Tests use `node --test`, like `apps/web`'s `e2e:env:test`, so the app needs no jest. `package.json` scripts:

```json
"generate": "node src/scripts/generate.ts && fumadocs-mdx",
"registry:build": "node src/scripts/registry.ts && shadcn build registry.json --output public/r && node src/scripts/check-registry.ts",
"dev": "yarn generate && yarn registry:build && next dev --webpack -p 3100",
"build": "yarn generate && yarn registry:build && next build --webpack",
"serve": "http-server out -p 3100 -c-1",
"type-check": "yarn generate && yarn run -T -B tsc --noEmit",
"lint": "eslint src",
"test": "node --test \"src/**/*.test.ts\"",
"test:e2e": "playwright test",
"scaffold:pages": "node src/scripts/scaffold-pages.ts",
"prettier": "prettier --check . --config ../../.prettierrc --ignore-path ../../.prettierignore",
"prettier:fix": "prettier --write . --config ../../.prettierrc --ignore-path ../../.prettierignore"
```

- `generate.ts` runs `stories`, `props`, `tokens`, `rules` and `icons` into `src/generated/` (gitignored). `fumadocs-mdx` writes `.source/` (gitignored).
- There's no `postinstall`, because lifecycle scripts run on every install for everyone.
- `type-check` generates first, because the generated modules are imported.
- Generation must finish in under 60 s (props is the slow part). If it doesn't, `props.ts` caches by file hash in `node_modules/.cache/safe-ui-docs`.

**D15. Lint and turbo.**

- `eslint.config.mjs` extends `config/eslint/base.mjs` and adds the design-system rules (`no-restricted-syntax` with `designSystemSyntaxRules` from `@safe-global/ui/eslint`). The docs code is held to the same rules as a consumer.
- It ignores `src/generated/**` and `.source/**`.
- `apps/design-system/turbo.json` (`"extends": ["//"]`) widens `type-check`, `lint` and `test` inputs with `content/**`, `registry.json`, `source.config.ts` and `next.config.mjs`. The root inputs only cover `src/**`, and the page-coverage and registry tests read `content/` and `registry.json`. The root `turbo.json` doesn't change.

**D16. CI: one optional build job, no deploy.**

- New `.github/workflows/design-system-checks.yml`. It isn't a required check, so it uses a plain `pull_request` `paths` filter (`apps/design-system/**`, `packages/ui/**`, `packages/theme/**`, `yarn.lock`, `.yarn/patches/**`, the workflow itself) and needs no `required-result` job.
- One job on `ubuntu-26.04-arm`: `actions/checkout@v7.0.1`, `./.github/actions/yarn`, then:
  - `type-check`, `lint`, `test`
  - `build`
  - `git diff --exit-code apps/design-system/registry.json`
  - `test -d apps/design-system/out/r && test -f apps/design-system/out/index.html`
- Action pins follow the existing workflows and `actions.lock`. No Playwright job in CI in this phase (it's a local gate, see Verification). No artifact upload and no deploy step (R13 deploys are Phase 4).

**D17. Commits.** Suggested sequence. Every commit builds.

1. `feat(ui): export the design-system eslint rules`
2. `feat(design-system): scaffold the docs site` (workspace, config, layouts, CSS, `yarn.lock`, root wiring)
3. `feat(design-system): generate previews, props, tokens and rules from packages/ui`
4. `feat(design-system): build the shadcn registry from packages/ui`
5. `feat(design-system): getting started and foundations pages`
6. `feat(design-system): component pages` (one commit per wave is fine)
7. `tests: design-system page, registry and crawl checks` (if not already in 3–6)
8. `chore: design-system checks workflow`
9. `docs: design-system app guidance`

## Target layout

```
apps/design-system/
  package.json  next.config.mjs  source.config.ts  postcss.config.mjs  tsconfig.json
  eslint.config.mjs  turbo.json  playwright.config.ts  .gitignore
  AGENTS.md  CLAUDE.md  README.md
  registry.json                         # generated by src/scripts/registry.ts, committed
  content/docs/
    meta.json  index.mdx  installation.mdx  theming.mdx  dark-mode.mdx  changelog.mdx
    foundations/{meta.json,colors,typography,spacing,radius,icons}.mdx
    components/{meta.json,<52 pages>.mdx}
    utilities/{meta.json,cn,hooks,provider}.mdx
  src/
    app/(docs)/{layout.tsx,docs.css,[[...slug]]/page.tsx}
    app/(preview)/preview/[component]/[story]/{layout.tsx,page.tsx,preview.css}
    app/api/search/route.ts  app/llms.txt/route.ts  app/llms-full.txt/route.ts
    app/fonts/{DMSansRegular,DMSans600,DMSans700}.woff2  app/fonts/fonts.css
    lib/{source.ts,env.ts,layout.shared.tsx,preview-config.ts,types.ts}
    components/docs/{component-preview,story-frame,component-install,component-usage,component-examples,
                     component-props,component-rules,base-ui-reference,registry-snippet,token-table,
                     color-swatches,spacing-scale,radius-scale,icon-grid}.tsx
    scripts/{generate,stories,props,tokens,rules,icons,registry,check-registry,scaffold-pages}.ts
    scripts/{stories,props,tokens,rules,registry,pages,env}.test.ts
    generated/                          # gitignored: previews/*, stories.json, props/*, tokens.json, rules.json, icons.json
  e2e/crawl.spec.ts
  registry/safe/                        # gitignored: transformed registry sources
  public/r/                             # gitignored: shadcn build output
  .source/  .next/  out/                # gitignored
```

## Tasks

Prefix every yarn command with `export COREPACK_NPM_REGISTRY=https://registry.npmjs.org &&`, and Storybook/Next builds with `NODE_OPTIONS=--max-old-space-size=8192`. `$SCRATCH` is the session scratchpad and `$BASE` is `git rev-parse HEAD` before T1. Paths are relative to `apps/design-system/` unless they start with a root folder.

### T1. Scaffold the workspace (one agent, first)

1. `package.json` (D1, D14): `"name": "@safe-global/design-system"`, `"private": true`, `"type": "module"`, `engines`, scripts, dependencies.
2. Config files:
   - `next.config.mjs` (D2)
   - `source.config.ts`: `defineDocs({ dir: 'content/docs' })`, with the frontmatter schema extended by `component: z.string().optional()`
   - `postcss.config.mjs` (`@tailwindcss/postcss`)
   - `tsconfig.json`: extends `../../config/tsconfig/confs/base.json`; `jsx: preserve`, the `next` plugin, `allowImportingTsExtensions`, `noEmit`; explicit `types: ["node", "react", "react-dom", "mdx"]`; `paths` `@/*` → `./src/*`, `@ui-stories/*` → `../../packages/ui/src/components/stories/*`, `fumadocs-mdx:collections/*` → `./.source/*`; no `baseUrl`
   - `eslint.config.mjs` (D15)
   - `turbo.json` (D15)
   - `.gitignore`: `.next`, `out`, `.source`, `src/generated`, `registry/safe`, `public/r`, `next-env.d.ts`, `playwright-report`, `test-results`
3. `src/lib/source.ts` (`loader({ baseUrl: '/', source: docs.toFumadocsSource() })`), `src/lib/env.ts` (D12), `src/lib/layout.shared.tsx` (nav title "Safe UI", the GitHub link), and `src/lib/types.ts`. `types.ts` holds the shared shapes of the generated data (`StoryIndex`, `StorySource`, `PropsDoc`, `TokenEntry`, `RuleDoc`, `IconList`), so T3 and T5 can work in parallel.
4. Both layouts, `docs.css`, `preview.css`, `fonts.css` and the copied fonts (D3, D9). `[[...slug]]/page.tsx` uses Fumadocs `DocsPage`, `DocsBody`, `DocsTitle` and `DocsDescription`, and an MDX components map that the docs components extend later. There's a placeholder `content/docs/index.mdx`.
5. Root wiring:
   - `knip.json`: add an `apps/design-system` workspace (`entry`: `src/app/**/{page,layout,route}.tsx?`, `src/scripts/*.ts`, `next.config.mjs`, `source.config.ts`, `playwright.config.ts`; `project`: `src/**/*.{ts,tsx}`; `ignore`: `src/generated/**`, `.source/**`)
   - `.prettierignore`: `apps/design-system/{.next,out,.source,public/r,registry/safe,src/generated,next-env.d.ts}`
   - root `AGENTS.md`: add an `apps/design-system/` row
6. `yarn install && yarn constraints`. Then `yarn why next` must show one `next` resolution. Then `yarn workspace @safe-global/design-system build`, which must produce `out/index.html` for the placeholder page.

### T2. `packages/ui`: the `./eslint` export (in parallel with T1)

- `packages/ui/package.json`: `"./eslint": "./eslint/design-system.mjs"`, placed before `"./package.json"`. No other change.
- `packages/ui/AGENTS.md`:
  - the docs site and the registry read stories, props, tokens and ESLint rules from this package, so story titles and the first story's content show in the docs
  - the `docs-hidden` tag (D4)
  - every new component needs a docs page (`yarn workspace @safe-global/design-system scaffold:pages`)
- `packages/ui/README.md`: link the docs site's Installation page and the registry.
- Gate: `yarn workspace @safe-global/ui test` (`package-exports.test.ts`) and `lint`.

### T3. Generators and their tests (after T1)

`src/scripts/{generate,stories,props,tokens,rules,icons}.ts` and `{stories,props,tokens,rules,env}.test.ts` per D4, D6, D7, D8 and D12. Each generator exports a pure function, which the tests call on the real `packages/ui` sources, plus a `main` that writes files. Test assertions:

- `stories`:
  - 52 story files and 93 stories are indexed, with names matching the exports
  - the Code source for `button/AllVariants` imports `@safe-global/ui/button`
  - no source contains `from '../`
- `props`:
  - `Button` has `variant` (6 values) and `size` (10 values)
  - `DialogContent` has `size`
  - every component file yields at least one component, except `overlay`, which yields `cva` variants
- `tokens`:
  - every declaration in `tokens.css` `:root` appears once, with its `.dark` value when there is one
  - the colors group is non-empty and holds `--primary` and `--background`
  - spacing holds `--space-1`
- `rules`:
  - every selector parses
  - Button, Card, Input, Tabs, Badge, Chip and Dialog map to pages
- `env`: as in D12.

### T4. Registry (after T1, in parallel with T3)

`src/scripts/{registry,check-registry}.ts`, `registry.test.ts`, the committed `registry.json` (D10), then `yarn workspace @safe-global/design-system registry:build`. Gate: `check-registry` prints the item count (52 components + `provider` + `utils` + 2 hooks + `theme` = 57) and exits 0.

### T5. Docs components and routes (after T1, in parallel with T3/T4, coding against `src/lib/types.ts`)

- `src/components/docs/*.tsx` (D4, D5, D7, D8, D12), registered in the MDX components map.
- `StoryFrame`:
  - iframe at `withBasePath('/preview/<c>/<s>/')`, lazy
  - height messages
  - an "Open in new tab" link
  - min height from `preview-config.ts`
- `ComponentPreview` and each example use Fumadocs `Tabs` (Preview | Code).
- `ComponentInstall` uses `Tabs` (npm | shadcn registry). The registry tab holds `RegistrySnippet` and `npx shadcn@latest add @safe/<name>`. The npm tab holds `yarn add @safe-global/ui` (with a note that the package isn't published yet, Phase 4) and the import line.
- The preview route page (D3/D4).
- The search route, with the static search option in `RootProvider`.
- The `llms` routes.
- The theme toggle is Fumadocs' built-in one, and ⌘K is the built-in search dialog (R12).

### T6. Getting started, Foundations and Utilities pages (after T5's component names are fixed in `types.ts`; content only)

`content/docs/{index,installation,theming,dark-mode,changelog}.mdx`, `foundations/*.mdx`, `utilities/*.mdx` and the `meta.json` files:

- **Introduction**: what Safe UI is, the two ways to consume it (npm and registry), and links.
- **Installation**:
  - npm path: install, the `tailwindcss` peer, the CSS entry from `packages/ui/README.md` with `@source`, loading DM Sans, `.dark`
  - registry path: `components.json` `registries` via `RegistrySnippet`, `shadcn add @safe/theme` then components, the base dependency on `@base-ui/react`, `rsc` behaviour
- **Theming**: `TokenTable`, overriding variables, `styles.css`/`scoped.css`/`tokens.css`, and that values come from `packages/theme` and never get edited by hand.
- **Dark mode**: the `.dark` class on an ancestor, a `next-themes` example for Next, a plain toggle for Vite, and `scoped.css` apps.
- **Changelog**: a placeholder saying versioned releases and changesets come with publishing (Phase 4). It links the git history of `packages/ui`.
- **Foundations**: as in D7.
- **Utilities**: `cn` and `ICON_STROKE`, `useIsMobile`/`useIsTablet`, and `ShadcnProvider` (portal container for the scoped variant). These pages have hand-written props tables, since they aren't component exports.

### T7. Component pages

- **T7.0 (one agent, after T3 and T5):** `yarn workspace @safe-global/design-system scaffold:pages` creates the 52 skeletons and `components/meta.json`. Commit with placeholder descriptions. `pages.test.ts` is added here and passes on structure.
- **T7.1 (wave 1, one agent):** the ten pages from D11. Write `description`, the usage notes and the accessibility notes. Run `build` and the crawl on these pages, and look at light/dark screenshots before wave 2 starts. Fix template issues in `src/components/docs/*` here, not in the waves.
- **T7.2 (wave 2, three agents in parallel, disjoint files):** the same for the remaining 42, split alphabetically (see Parallelization). Accessibility notes come from the component's Base UI page (keyboard, focus, ARIA), `vaul` for Drawer, `sonner` for Sonner, `react-day-picker` for Calendar, and `input-otp`. They state facts, not guesses: if unsure, link the upstream page and say nothing else. Waves only edit their own `content/docs/components/<name>.mdx`.

### T8. Docs, guidance, CI (in parallel with T7)

- `apps/design-system/AGENTS.md` and a one-line `CLAUDE.md`:
  - what the app is
  - "consumes `@safe-global/ui` like an outside app, never `@safe-global/views`, never `.shadcn-scope`"
  - generated vs hand-written files
  - how to add a page
  - the env variables
  - the checks
- `README.md`: run, build, serve, `basePath`, the registry URL, and that `out/` deploys to any static host.
- `.github/workflows/design-system-checks.yml` (D16).
- Root `AGENTS.md` row (if not done in T1).

### T9. Verify (below), then T10: the SC4 smoke test and the acceptance checks.

## Parallelization

| Group | Tasks (run together)                    | Files touched                                                                                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1    | **A:** T1                               | `apps/design-system/{package.json,next.config.mjs,source.config.ts,postcss.config.mjs,tsconfig.json,eslint.config.mjs,turbo.json,.gitignore}`, `src/lib/{source,env,layout.shared,types}.ts(x)`, `src/app/**` (layouts, CSS, fonts, slug page), `content/docs/index.mdx`, `yarn.lock`, `knip.json`, `.prettierignore`, root `AGENTS.md` |
|       | **B:** T2                               | `packages/ui/{package.json,AGENTS.md,README.md}`                                                                                                                                                                                                                                                                                        |
| G2    | **C:** T3                               | `src/scripts/{generate,stories,props,tokens,rules,icons}.ts`, `src/scripts/{stories,props,tokens,rules,env}.test.ts`                                                                                                                                                                                                                    |
|       | **D:** T4                               | `src/scripts/{registry,check-registry}.ts`, `src/scripts/registry.test.ts`, `registry.json`                                                                                                                                                                                                                                             |
|       | **E:** T5                               | `src/components/docs/*`, `src/lib/preview-config.ts`, `src/app/(preview)/**`, `src/app/api/search/route.ts`, `src/app/llms*.txt/route.ts`, the MDX components map in `src/app/(docs)/[[...slug]]/page.tsx`                                                                                                                              |
|       | **F:** T6                               | `content/docs/{index,installation,theming,dark-mode,changelog}.mdx`, `content/docs/meta.json`, `content/docs/foundations/**`, `content/docs/utilities/**`                                                                                                                                                                               |
| G3    | **T7.0** (one agent, after C and E)     | `src/scripts/scaffold-pages.ts`, `src/scripts/pages.test.ts`, `content/docs/components/**` (skeletons, `meta.json`)                                                                                                                                                                                                                     |
| G3a   | **T7.1** (one agent)                    | `content/docs/components/{typography,button,tooltip,alert,skeleton,separator,spinner,card,dialog,badge}.mdx`; template fixes in `src/components/docs/*`                                                                                                                                                                                 |
| G3b   | **T7.2-1:** accordion → empty (14)      | `content/docs/components/{accordion,alert-dialog,aspect-ratio,avatar,breadcrumb,calendar,checkbox,chip,collapsible,combobox,context-menu,drawer,dropdown-menu,empty}.mdx`                                                                                                                                                               |
|       | **T7.2-2:** field → progress (14)       | `content/docs/components/{field,hover-card,input,input-group,input-otp,kbd,label,link,list,navigation-menu,overlay,pagination,popover,progress}.mdx`                                                                                                                                                                                    |
|       | **T7.2-3:** radio-group → toggle (14)   | `content/docs/components/{radio-group,resizable,scroll-area,search-input,select,sheet,sidebar,slider,sonner,switch,table,tabs,textarea,toggle}.mdx`                                                                                                                                                                                     |
|       | **G:** T8                               | `apps/design-system/{AGENTS,CLAUDE,README}.md`, `.github/workflows/design-system-checks.yml`                                                                                                                                                                                                                                            |
| G4    | T9 → T10 (sequential, after everything) | none (scratch only), plus fixes                                                                                                                                                                                                                                                                                                         |

Ordering rules:

- A owns `yarn.lock` and every dependency. No other stream edits a `package.json` except B, which edits `packages/ui/package.json`.
- C, D, E and F only start once A's `build` produces `out/index.html`. E codes against `src/lib/types.ts`. If a shape has to change, C changes `types.ts` and tells E. E doesn't edit it.
- E only adds keys to the MDX components map; F only writes MDX that uses the documented component names.
- During G2, each agent runs only its own `node --test` file and `type-check`. The full `build` runs at the end of G2 by one agent (the one that finishes last), before T7.0.
- Wave 2 waits for wave 1's template fixes. Wave agents edit only their own MDX files. If a wave finds a template bug, it reports it to the lead instead of editing `src/components/docs/*`.
- Only verification started after the last edit counts.

## Verification commands

From the repo root, with the corepack prefix and `NODE_OPTIONS=--max-old-space-size=8192`:

```bash
yarn install && yarn constraints
yarn why next                                   # a single next@patch:16.4.2 resolution

# packages/ui (only the exports key and docs changed)
yarn workspace @safe-global/ui type-check
yarn workspace @safe-global/ui lint
yarn workspace @safe-global/ui test
yarn workspace @safe-global/ui prettier
yarn workspace @safe-global/ui build-storybook   # the stories the docs reuse still build

# design-system
yarn workspace @safe-global/design-system type-check
yarn workspace @safe-global/design-system lint
yarn workspace @safe-global/design-system test
yarn workspace @safe-global/design-system prettier
yarn workspace @safe-global/design-system build                     # generate + registry:build + next build → out/
git diff --exit-code apps/design-system/registry.json                # registry.json is current
ls apps/design-system/out/r/*.json | wc -l                           # 58: 57 items + registry.json
find apps/design-system/out -name index.html | wc -l                 # ≥ 52 component pages + 13 other pages + 93 preview pages
yarn workspace @safe-global/design-system test:e2e                   # crawl, see below

# basePath build (host-agnostic proof), served from a subfolder
NEXT_PUBLIC_BASE_PATH=/safe-ui yarn workspace @safe-global/design-system build
mkdir -p $SCRATCH/host && rm -rf $SCRATCH/host/safe-ui && cp -r apps/design-system/out $SCRATCH/host/safe-ui
BASE_URL=http://localhost:3101/safe-ui yarn workspace @safe-global/design-system test:e2e   # webServer serves $SCRATCH/host on 3101
yarn workspace @safe-global/design-system build                      # rebuild without basePath for SC4

# repo-level
yarn turbo run type-check lint test --filter=@safe-global/ui --filter=@safe-global/design-system --force
yarn knip --workspace apps/design-system
yarn prettier

# wallet untouched (Phase 2 skipped)
git diff --stat $BASE.. -- apps/web apps/web-tanstack packages/views     # prints nothing
```

**Crawl (`e2e/crawl.spec.ts`, `playwright.config.ts`).** The `webServer` is `http-server out -p 3100 -c-1`, or `$SCRATCH/host` on 3101 when `BASE_URL` has a path. Chromium only.

- **Routes.** Start from `/` and the page list in `.source` (the sitemap). Visit every docs page and every `/preview/*/*/` page. Assert:
  - HTTP 200
  - no `pageerror`
  - no `console.error`, except an allowlist that starts empty and has a reason for each entry
  - every same-origin `<a href>` returns 200 through `request.get`
  - every `<iframe>` on a component page loads, and its document contains `#story-root` with at least one child
- **Registry.** Every `r/*.json` returns 200 with `content-type` JSON and parses.
- **Features.**
  - ⌘K opens search, and typing "button" lists the Button page (static index)
  - the theme toggle adds and removes `html.dark` on the docs page, and an open preview iframe follows it (D4 storage listener)
  - the copy button on a Code tab writes to the clipboard (grant `clipboard-read`/`clipboard-write`)
  - at a 390×844 viewport, the sidebar collapses to the menu button and the page has no horizontal scroll (`scrollWidth <= innerWidth`)
- **Screenshots** to `test-results/shots/`, light and dark: `/`, `/installation/`, `/foundations/colors/`, `/components/button/`, `/components/dialog/`, `/components/sidebar/`, and the mobile `/components/button/`. They're for review, not baselines: no visual assertion in this phase.

**SC4 smoke test (T10, scratch only, never committed).** The npm registry is reachable here, and plain `npm` in the scratchpad isn't under the Yarn age gate. Use `npm install --before=2026-11-04` anyway, so the same rule applies.

```bash
yarn workspace @safe-global/design-system serve &                      # out/ on :3100
mkdir -p $SCRATCH/sc4 && cd $SCRATCH/sc4
npm init -y && npm install --before=2026-11-04 vite@8.3.5 @vitejs/plugin-react react@19.2.0 react-dom@19.2.0 \
  tailwindcss@^4.1.18 @tailwindcss/vite@^4.3.3 typescript@~5.9.2 @types/react@~19.2.10 @types/react-dom@~19.2.0
# hand-write: index.html, src/main.tsx, src/index.css (@import "tailwindcss";), vite.config.ts (react + tailwind, alias @ → ./src),
# tsconfig.json (paths @/* → ./src/*), components.json (style "base-vega", rsc false, tsx true, tailwind.css src/index.css,
# aliases @/components, @/components/ui, @/lib, @/lib/utils, @/hooks, registries { "@safe": "http://localhost:3100/r/{name}.json" })
npx -y shadcn@3.8.5 add @safe/theme --yes
for item in $(node -e "console.log(require('<repo>/apps/design-system/out/r/registry.json').items.map(i=>i.name).filter(n=>n!=='theme').join(' '))"); do
  npx -y shadcn@3.8.5 add @safe/$item --yes --overwrite || echo "FAIL $item"
done
npx tsc --noEmit && npx vite build
# src/App.tsx renders a themed Button and an open Dialog; Playwright screenshots light (no class) and dark (html.dark)
# repeat the add loop in a fresh copy with npx -y shadcn@4.23.0 to check the current CLI
```

Pass means:

- every item installs
- `tsc` and `vite build` pass
- `src/index.css` carries the theme variables
- the screenshots show Safe-styled Button and Dialog in both modes

**SC1 (local, best effort).** `yarn workspace @safe-global/ui pack` into `$SCRATCH/ui.tgz`, a second Vite app installs it, and the app follows the Installation page's npm steps (`@import '@safe-global/ui/styles.css'`, `@source '../node_modules/@safe-global/ui/src'`). Record whether Vite compiles the raw `.tsx` from `node_modules`, and which `optimizeDeps` setting it needed, as an implementation note. The real SC1 needs the Phase 4 `dist` build, so a failure here is a finding, not a blocker.

## Acceptance checks

1. **Static, host-agnostic export.** `build` writes `out/` with `index.html` at the root and `trailingSlash` folders. The `basePath` build serves correctly from `/safe-ui/`: the crawl passes there too, including fonts, search and the registry JSON. There's no host-specific file in the app (`ls -a apps/design-system` shows none of `vercel.json`, `netlify.toml`, `_redirects`, `_headers`, `CNAME`, `.nojekyll`, `firebase.json`, `wrangler.toml`), and no host name in the source (`grep -rn "vercel\|netlify\|github.io\|pages.dev" apps/design-system --exclude-dir=node_modules --exclude-dir=out --exclude-dir=.next` prints nothing).
2. **SC3: 100% of component exports have a page with a preview and props.** `pages.test.ts` passes. The crawl shows 52 component pages, each with at least one loaded preview iframe and at least one rendered props table (or the `cva` variants table for `overlay`).
3. **R10 anatomy.** Each component page has the seven sections in order: preview with Preview/Code tabs, Installation (npm and `shadcn add @safe/<name>`), Usage, Examples, Props, Accessibility, Do/Don't. The Do/Don't section is non-empty on Button, Card, Input, InputGroup, SearchInput, Select, Tabs, Badge, Chip, Dialog, Sheet and Drawer.
4. **R6/R17 reuse.** A temporary extra story added to `packages/ui/src/components/stories/badge.stories.tsx` (reverted afterwards) appears under Examples on `/components/badge/` after `build`, with no docs edit.
5. **US2.2 pages.** Introduction, Installation, Theming, Dark mode, Changelog and the five Foundations pages exist and are in the sidebar. The token tables list every variable in `tokens.css`. `tokens.test.ts` proves it, and the Colors page shows the same count.
6. **R11/US4.**
   - `registry.json` lists the 52 components as `registry:ui` and `theme` as `registry:theme`, and it's current (`git diff --exit-code` after build)
   - `out/r/*.json` validate against `shadcn/schema`
   - no item `content` holds a relative import that leaves the item
   - every `registryDependencies` entry resolves
7. **SC4 (local).** The smoke test passes for every item with `shadcn@3.8.5`, and the result with `shadcn@4.23.0` is recorded. Any failing item is listed with its cause. `@safe/theme` writes the light/dark variables and the `@theme inline` block into the consumer CSS.
8. **No copied values.** `grep -rnE '#[0-9a-fA-F]{3,8}\b|oklch\(' apps/design-system/src apps/design-system/content --include=*.{ts,tsx,mdx,css}` prints nothing, except the generated folder, which is gitignored and excluded.
9. **R12.** The crawl proves the light/dark toggle, ⌘K search, copy-to-clipboard and the mobile layout. `out/llms.txt` exists and lists every page, or the deviation is recorded (D3).
10. **Consumer-style CSS.** `preview.css` and `docs.css` import `@safe-global/ui/styles.css`, never `scoped.css` or a relative `packages/ui` path. `grep -rn "shadcn-scope\|ShadcnProvider\|@safe-global/views" apps/design-system/src apps/design-system/content` prints only the Utilities/Theming prose about the scoped variant.
11. **Phase 2 boundary.** `git diff --stat $BASE.. -- apps/web apps/web-tanstack packages/views` prints nothing. In `packages/ui`, `git diff $BASE.. -- packages/ui` shows only the `./eslint` key, `AGENTS.md` and `README.md`. Phase 0 checks 3/4 and Phase 1 check 11 (isolation) still print nothing.
12. Every command in "Verification commands" passes. `yarn workspace @safe-global/ui build-storybook` still builds. Screenshots of `/`, `/foundations/colors/`, `/components/button/` and `/components/dialog/`, in light and dark, look themed: Safe colors, DM Sans, open dialog styled inside its frame.

## Requirement traceability

| Req       | Phase 3 status                                                                                                      | Rest goes to                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| R1        | **Addressed**: `./eslint` added; all R1 keys now exist                                                              | —                                            |
| R2        | Unchanged; registry copies get `'use client'` (D10)                                                                 | `dist`, `.d.ts`, banners → P4                |
| R3        | **Addressed for docs**: Installation documents `styles.css` + `@source`, and the site itself consumes it that way   | `@source` → `dist` → P4                      |
| R4        | Unchanged; the docs read the generated tokens, with no copied values (check 8)                                      | design-owned neutral mapping → follow-up     |
| R5        | **Strengthened**: a Next App Router consumer (the docs) and a Vite consumer (SC4 smoke test)                        | —                                            |
| R6        | **Addressed**: docs previews are the package stories (D4)                                                           | —                                            |
| R7        | Deferred                                                                                                            | P4                                           |
| R8        | **Addressed**: Next 16 static export + Fumadocs + Tailwind v4, consuming the package like an outside app            | —                                            |
| R9        | **Addressed** (Blocks later)                                                                                        | Blocks/patterns → later                      |
| R10       | **Addressed** (D5–D8)                                                                                               | —                                            |
| R11       | **Addressed** (D10)                                                                                                 | hosting the registry → P4                    |
| R12       | **Addressed**: toggle, ⌘K static search, copy, mobile, `llms.txt`                                                   | MCP → later                                  |
| R13       | **Static-export part addressed**: plain `out/`, configurable `basePath`/`assetPrefix`, no host files, CI build only | domain, host, deploys, PR previews → P4      |
| R14       | Deferred                                                                                                            | P2 (skipped for now)                         |
| R15       | Unchanged (`figma-code-connect.md` stays in `packages/ui`; Figma links in story JSDoc show in the Code source)      | linking Figma from docs pages → follow-up    |
| R16       | **Partial**: the docs page check makes "new component ⇒ page" enforced                                              | major-changeset rule → P4                    |
| R17       | **Partial**: "a story a designer adds shows up in the docs" holds (check 4)                                         | Chromatic + required design check → P2       |
| US2       | **Addressed** (checks 1–5, 9)                                                                                       | —                                            |
| US4.1–4.3 | **Addressed locally** (checks 6–7); the URL is configurable, and the docs show the right one on any host            | public URL → P4                              |
| SC1       | **Partial**: Installation page written; local Vite consumer via the registry (SC4 test), npm tarball best effort    | fresh app outside the monorepo from npm → P4 |
| SC2       | Unchanged (wallet untouched, check 11)                                                                              | P2                                           |
| SC3       | **Addressed** (check 2)                                                                                             | —                                            |
| SC4       | **Addressed locally** (check 7)                                                                                     | against the hosted URL → P4                  |
| SC5       | Unchanged (Phase 1); the docs read generated files only                                                             | —                                            |

## Risks

1. **Two `next` instances.** `apps/web` uses a patched `next`. A docs site on plain `16.4.2` could nest its own copy, while `fumadocs-core`/`fumadocs-ui` hoist and resolve the other one, which breaks `next/navigation` contexts at runtime. D1 uses the same patched descriptor, and verification runs `yarn why next`. Fallback: `resolutions` for `next` scoped to the fumadocs packages.
2. **Age gate on transitive dependencies.** Fumadocs brings new transitive packages (shiki 4, motion, Radix). If `yarn install` refuses a too-new version, pin the newest passing one via `resolutions` and record it. If a pinned Fumadocs version turns out broken with Next 16.4.2, step back one patch (16.17.9 / 15.4.9), never forward past the cutoff.
3. **`composeStories` in a browser bundle** may pull Storybook preview internals that don't bundle under Next webpack. The D4 fallback renders `render`/`component` by hand, and only two stories use decorators.
4. **Stories that rely on Storybook globals or layout** (fullscreen sidebar, portalled overlays, `play`-less interactions) may look different in a plain iframe. Per-component minimum heights help. `play` functions aren't run, so stories that need them to look right show their initial state. Wave 1 lists any such story, and it's fixed in docs config, never by editing the story (stories are the wallet's visual baseline).
5. **`transpilePackages` and the `@ui-stories` alias.** If SWC doesn't transpile the aliased story files, the fallback is a `./stories/*` export key in `packages/ui` (D2). It's harmless to the wallet, but it widens the package's surface until Phase 4 limits `files`.
6. **`shadcn build`/`add` handling of non-TS files and namespaced `registryDependencies`.** The `table.module.css` placement and `@safe/x` dependency resolution are verified by the SC4 smoke test with both CLI majors. If a case fails, document the manual step on the page and record it. The npm package path is unaffected.
7. **Import rewriting edge cases in the registry transform** (type-only imports, multi-line imports, `import * as`). It uses the TypeScript AST, not regexes, and `check-registry` rejects any remaining `../`.
8. **Props noise or gaps.** Base UI props can be large, and `VariantProps` may resolve to `string`. `props.test.ts` pins the Button/Dialog expectations. If literal unions don't come through, `props.ts` reads them from the `cva` config (the same code as for `overlay`).
9. **Fumadocs CSS against the package base layer** (`* { border-border }`, `body { bg-background }`) in the docs chrome. Only the docs layout loads both, and previews load only the package CSS. If the chrome looks off, the docs layout imports `tokens.css` + `tailwind-theme.css` instead of `styles.css`, recorded as a deviation. Previews keep `styles.css`.
10. **Static search and `basePath`.** The static index URL must carry the base path (D3). The `basePath` crawl covers it.
11. **Build time and memory.** 93 preview pages, props for 52 files, plus the MDX build. `NODE_OPTIONS=--max-old-space-size=8192`, and a props cache if generation takes over 60 s (D14).
12. **Node type stripping** needs Node ≥ 22.18. CI uses `.nvmrc` (24). A contributor on 22.12–22.17 gets a clear `engines` error. Fallback: `--experimental-strip-types` in the scripts.
13. **Wallet regression by accident.** Root files (`yarn.lock`, `knip.json`, `.prettierignore`) are shared. The `git diff --stat` guard (check 11) and `yarn constraints` catch app-level changes. `yarn.lock` changes must only add packages: no version change for an existing `apps/web` resolution. Check with `git diff yarn.lock | grep '^-  version'`, which must print nothing, or each line must be explained.

## Decisions needing user input

These have defaults, and the plan proceeds with them unless the user says otherwise:

1. **Docs at the site root** (`/components/button/`) rather than `/docs/...` (D3).
2. **Previews in iframes of per-story static pages** (D4), rather than inline like ui.shadcn.com. It's needed for `defaultOpen` and fixed-position stories, and it keeps docs CSS out of previews.
3. **`'use client'`** is added only to the registry copies (D10). The npm package's source banners stay Phase 4, as Phase 0 planned. Alternative: add `'use client'` to the 36 `packages/ui/src/components/*.tsx` files that lack it now, which would let Next App Router apps use the npm path before Phase 4. That's a source change in `packages/ui` with no wallet effect.
4. **Fonts:** the docs app self-hosts a copy of DM Sans (D9). Alternative: ship `@safe-global/ui/fonts.css` with the font files in the package, the Phase 1 D8 follow-up.
5. **`packages/ui/components.json` is not added** (D13).
6. **CI:** add the optional, non-required `design-system-checks.yml` (D16), or skip CI for the app until Phase 4.
7. **Registry namespace `@safe`** (from the spec) and item names equal to the export keys, plus `theme`, `utils`, `provider`, `use-mobile`, `use-tablet`.

## Implementation notes

All seven "Decisions needing user input" use their default (first) option: docs at the site root, iframe previews, `'use client'` only in the registry copies, the docs app self-hosts DM Sans, no `packages/ui/components.json`, the optional `design-system-checks.yml`, and the `@safe` namespace with item names equal to the export keys.

Deviations from the plan:

1. **No subagents.** The plan's parallel streams were done in sequence by one engineer, so no two streams ever touched the same file.
2. **Dependencies.**
   - `zod` is `^4.6.7`, not `^4.1.11`. With `^4.1.11` the app got zod 4.3.5 while `fumadocs-mdx` nested 4.6.7, and `frontmatterSchema.extend()` failed type-checking (TS2589). 4.6.7 was already in the lockfile.
   - Added `lucide-react ^0.563.0` (the `packages/ui` range) for the Icons page, `storybook ^10.6.5` (the `@storybook/react` peer), `eslint-plugin-react`, `eslint-plugin-react-hooks` and `@eslint/js` (needed by `config/eslint/base.mjs`), and `prettier ^3.9.10`: without its own entry the workspace script resolved a hoisted prettier 3.8.1, which formats MDX code samples differently from the root 3.9.
   - The root resolution `motion: 12.34.0` also applies to `fumadocs-ui` (which asks for `^14.6.0`). Only the unused Flux layout imports `motion`, and the build and crawl pass, so no override was added.
   - No age-gate refusal happened; `yarn.lock` only adds packages (`git diff 5dba2e98 -- yarn.lock | grep '^-  version'` prints nothing).
3. **Fumadocs 16.17.10 API.**
   - `fumadocs-mdx:collections/server` is a URI scheme that Next's webpack does not handle, so `src/lib/source.ts` imports `../../.source/server` and the tsconfig has no `fumadocs-mdx:collections/*` path.
   - The static search uses `search.options.type: 'static'` (deprecated in the typings, still supported) with `withBasePath('/api/search')`. The dialog's hotkey compares `e.key === 'k'`, so the crawl presses `ControlOrMeta+k`.
   - `llms.txt` and `llms-full.txt` are in: `includeProcessedMarkdown` exists in 15.4.10.
   - The generated Fumadocs CSS prints two harmless `::highlight(fd-search)` warnings during the CSS optimisation step.
4. **`composeStories` works in the browser bundle**, so the D4 fallback was not needed. The `@ui-stories` webpack alias is transpiled through `transpilePackages`, so no `./stories/*` export was added.
5. **Previews.**
   - Stories whose meta has `decorators` (card, typography) wrap the canvas in a `min-height: 100vh` box with padding. In an auto-height iframe the preview padding made that box grow on every resize message. The generated preview module drops the canvas padding for decorated files, and `StoryFrame` ignores height changes under 2px.
   - The avatar and aspect-ratio stories load `mock-assets/github.com/*.webp` relative to the document (served by the `apps/web` Storybook's `staticDirs`). The two images are copied read-only into `apps/design-system/mock-assets/`, and `stories.ts` copies each into `public/preview/<component>/<story>/mock-assets/` (gitignored) for the stories that use them.
   - The crawl allowlists one console error: the avatar story's deliberately broken `https://example.com/does-not-exist.png`, which demonstrates `AvatarFallback`.
   - The story layout parameter (`fullscreen`, `centered`, `padded`) is read from the composed story.
6. **Props.** `react-docgen-typescript` reports declaration file names relative to the parent of the working directory, so the filter matches `packages/ui/src/` by path segment. It also treats `overlayVariants` as a component, so only capitalised exports count as components. Exports aliased in an `export { A as B }` list are renamed to their public name. Besides `packages/ui/src`, Base UI and `cva`, props declared by `react-resizable-panels`, `vaul`, `input-otp` and `sonner` are kept (react-day-picker's are not: too many). Button has 8 variants and 12 sizes in the `cva` config, not the 6 and 10 the story's `argTypes` list, so `props.test.ts` compares the props against the `cva` config.
7. **Tokens.** `--destructive-foreground` is declared only on `.dark`, so `TokenEntry.light` is optional and the tables show 124 variables. The Colors page resolves each `var()` reference from the generated token values at build time instead of reading `getComputedStyle` in the browser: inside `html.dark` every element inherits the dark values, so a light swatch could not be measured on a dark page.
8. **Registry.**
   - `registry.json` is in `.prettierignore`. Lint-staged had reformatted the first committed copy, which broke the drift test (fixed in its own commit).
   - shadcn 3.8.5 places `table.module.css` next to `table.tsx` (`src/components/ui/`) with both CLI versions, so the Table page needs no manual step.
   - The theme item's `css` carries the two `@import`s, the `@custom-variant dark` and the `@layer base` rules; `cssVars.theme` holds every `@theme inline` declaration, including `--font-sans` and the radius scale.
9. **Code tab sources** include top-level helpers that a story references (for example overlay's `PageBehind`). A block-bodied `render` is printed as a named function, and `{...args}` is replaced by the merged meta and story args.
10. **Usage section.** `ComponentUsage` shows the shortest story's source when it has 30 lines or fewer, otherwise the import line and the root component.
11. **Theme in previews** follows the plan (query, `localStorage.theme`, `prefers-color-scheme`, `storage` listener); the crawl checks that an open preview follows the toggle.
12. **Crawl.** `playwright.config.ts` takes `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (the container has Chromium 1243, the lockfile Playwright expects 1248) and `HOST_DIR` for the base-path run instead of a hard-coded scratchpad. It uses 2 workers: with 4, two iframe-heavy pages timed out under load. Search results are listbox options, not links, so the test checks the option and presses Enter.
13. **Extras.** `src/app/icon.svg` (the missing favicon was the only 404 in the console), `Kbd` from `@safe-global/ui/kbd` in the MDX map, and `src/scripts/paths.ts` for the shared paths.
14. **Commits.** D17's sequence, with two `fix(design-system)` commits (registry formatting, prettier pin) and the workflow and guidance split into `chore:` and `docs:`. `.github/workflows/actions.lock` gained the new workflow's entry by hand, since `gh actions-lock` is not installed here; it lists the same actions as `web-tanstack-checks.yml`.
15. **SC4 smoke test environment.** The shadcn CLI sends every request, `localhost` included, through `https_proxy` and ignores `NO_PROXY`. The agent proxy refuses both localhost and `ui.shadcn.com`. So the CLI ran with only the lowercase `https_proxy` removed from its environment (npm installs still used the proxy), and with `REGISTRY_URL` pointing at a local stub of `colors/neutral.json`, which the CLI fetches for every component. The `npm install` that `shadcn add` runs for item dependencies does not take `--before`. None of this applies outside this container.

16. **Review fixes (after approval).**
    - Story descriptions render backtick spans as `<code>` (shared `withCode` in `src/components/docs/inline-code.tsx`).
    - The Button `Guidelines` story is wallet-internal guidance (its canvas names `components/ui/button.tsx`), so it is tagged `docs-hidden`: the docs show 92 of the 93 stories. Two `packages/ui` comments that pointed at repo paths were reworded (`typography.tsx`, `overlay.ts`), so the registry ships none. This widens check 11: besides the `./eslint` key, `AGENTS.md` and `README.md`, `packages/ui` now has those two comment edits and the one tag. The ui Storybook's 93 story IDs are identical before and after.
    - `INTERNAL_REFERENCE` in `src/scripts/paths.ts` (`.claude/`, `AGENTS.md`, `apps/web`, `@safe-global/views`, `packages/{ui,theme,views}/`, `.storybook/`) is rejected by `check-registry` in every item's content and asserted by `registry.test.ts` and `stories.test.ts` (descriptions and Code tab sources).
    - `next.config.mjs` and `src/lib/env.ts` share `normaliseBasePath` from `src/lib/base-path.mjs` (with a `.d.mts`), and `env.test.ts` pins that the config uses it.
    - `design-system-checks.yml` now runs prettier and, after the build, installs the Chromium headless shell and runs the crawl (D16 had no Playwright job in CI). Its paths filter adds `package.json`, `.yarnrc.yml`, `yarn.config.cjs`, `.prettierrc`, `.prettierignore` and the `yarn`/`corepack` actions, per `docs/ci-required-checks.md`.
    - After these fixes: ui type-check, lint, test (243) and prettier pass; design-system type-check, lint, test (34), prettier and build pass; `registry.json` is current; no `out/r/*.json` mentions `.claude`, `AGENTS.md`, `apps/web` or `@safe-global/views`; knip passes; the root crawl passes (178 tests, one preview fewer).

Verification results (all after the last code change):

- `yarn constraints` passes; `yarn why next` shows one `next@patch:16.4.2` resolution.
- `packages/ui`: type-check, lint, test (243), prettier and `build-storybook` pass.
- `apps/design-system`: type-check, lint, test (31 tests: stories, props, tokens, rules, env, registry drift, page coverage), prettier and `build` pass. `registry.json` is current. `out/` has 58 registry JSON files, 160 `index.html` files (65 docs pages: 13 + 52 components; 93 previews; the `404` and `_not-found` pages), 52 component pages, `llms.txt` and `llms-full.txt`. Build time is about 50 s; generation is about 8 s, so no props cache.
- Crawl: 179 tests pass at the root and from `/safe-ui/` (base-path build copied into a subfolder): every page and preview returns 200 with no console errors, every internal link resolves, every preview iframe renders, every registry item is served as JSON, `llms.txt` lists every page, and search, the theme toggle (with an open preview following it), copy and the mobile layout work.
- `yarn turbo run type-check lint test --filter=@safe-global/ui --filter=@safe-global/design-system --force`, `yarn knip --workspace apps/design-system` and `yarn prettier` pass.
- Acceptance checks 1, 8, 10 and 11: no host files; the host-name grep only matches gitignored build output (`tsconfig.tsbuildinfo`, `src/generated`); no hex or `oklch()` in `src/` or `content/`; `shadcn-scope`/`ShadcnProvider` appear only in the Theming, Dark mode, Introduction and Utilities prose; `git diff 5dba2e98 -- apps/web apps/web-tanstack packages/views` is empty; `packages/ui` changes are the `./eslint` key, `AGENTS.md` and `README.md`.
- Check 4: a temporary `DocsReuseProbe` story in `badge.stories.tsx` appeared under Examples on `/components/badge/` (and as `/preview/badge/docs-reuse-probe/`) after `build`; reverted.
- SC4: in a fresh Vite 8 + Tailwind v4 app, `shadcn@3.8.5 add` installed `@safe/theme` and then all 56 other items; `tsc --noEmit` and `vite build` pass; `src/index.css` has the `@theme inline` block and the light and dark variables; screenshots show a Safe-styled Button and an open Dialog in both modes (DM Sans is not loaded there, as documented). With `shadcn@4.23.0` in a fresh copy, all 57 items install and `tsc` and `vite build` pass.
- SC1 (best effort): `yarn workspace @safe-global/ui pack` installed into a fresh Vite app; following the Installation page (`styles.css` plus `@source '../node_modules/@safe-global/ui/src'`), `vite build` compiles the raw `.tsx` with no `optimizeDeps` setting, and `tsc` passes. The dev server was not tried. The tarball has no `files` list yet, so it ships `storybook-static`, tests and configs (Phase 4).

## Follow-ups

- Phase 4: `files` in `packages/ui/package.json` (the packed tarball carries `storybook-static`, tests and configs), the `dist` build, and a hosted registry URL.
- `packages/ui`'s own Storybook does not serve `mock-assets/`, so the avatar and aspect-ratio images 404 there; the docs app now holds a copy. Moving the two images into `packages/ui` (and pointing both Storybooks at them) would remove the copy.
- Font packaging (Phase 1 D8) is still open: the docs app and `apps/web` each hold a copy of DM Sans.
- shadcn CLI: it ignores `NO_PROXY`, and it needs `ui.shadcn.com` for every component, even from a third-party registry. Teams behind a proxy should know this before relying on the registry path.
- `fumadocs-ui` asks for `motion ^14.6.0` while the root pins `12.34.0`; harmless while the Flux layout is unused.
- `packages/ui/components.json` (D13) and an alias-free flow for adding upstream components.

## Redesign (post-review)

The user finds the current site too close to Storybook and wants a dev-focused site in the spirit of ui.shadcn.com, with an original layout and Safe colours. Constraints are unchanged: wallet untouched, static export, host-agnostic, `basePath` works, no new hex or `oklch()` in `src/` or `content/`, sentence case, minimal comments.

### Decisions

- **Routes.** `/` landing, `/docs/…` (Introduction at `/docs/`, Get started at `/docs/installation/`), `/components/` index plus the existing `/components/<name>/` pages, `/typeset/`, `/create/`. Previews stay at `/preview/<component>/<story>/`. The old root docs URLs (`/installation/`, `/foundations/…`, …) move under `/docs/`; there are no redirects, since the site has never been deployed.
- **One Fumadocs source, two sections.** `content/docs/docs/**` and `content/docs/components/**` stay in one loader (`baseUrl: '/'`), so URLs, search and `llms.txt` come for free. Each section's layout passes only its own folder of the page tree to `DocsLayout`, so Docs and Components get separate sidebars. Docs sidebar order: Introduction, Installation, Theming, Dark mode, Foundations, Changelog, Utilities.
- **Site shell.** A `(site)` route group with one root layout: `RootProvider` (static search, `next-themes`, system default) and a full-width sticky header on every page: the Safe UI wordmark, nav (Home, Docs, Get started, Components, Typeset, Create), a ⌘K search box, the GitHub link, the theme toggle and a green "New project" button to `/create/`. Below `md` the nav collapses into a menu sheet. `DocsLayout` sits under the header through `--fd-banner-height`; its own search and theme controls are off.
- **Brand colour from tokens only.** Safe green is `--color-static-text-brand` (the same in both themes), with `--color-static-main` as its ink. A `.brand` scope re-points `--primary`/`--primary-foreground` at them, so CTAs stay plain `Button variant="default"` and the design-system lint rules still hold. Dark mode uses the Safe dark tokens (`--background`, `--card`, `--color-background-main`).
- **Home.** An announcement pill linking to the registry section, a large hero, two CTAs, then a responsive masonry of showcase cards built inline with real `@safe-global/ui` components and Safe-flavoured demo content (send tokens form, controls, signers 2 of 3, pending transactions, activity chart from divs and tokens, settings tabs, alert and dialog, calendar). Demo content lives in the docs app only; `packages/ui` does not change.
- **Components index.** `content/docs/components/index.mdx` renders a client-side filterable grid of the 52 components: a lazily loaded, scaled live thumbnail of the first story, the name and the page description.
- **Typeset.** A client page that renders every `Typography` variant large, reads font size, weight and line height from the computed style (so the labels always match the tokens), offers copyable code per variant and an editable sample text shared by all specimens.
- **Create.** A client-only generator: framework (Vite, Next.js), components (checkbox grid, select all, presets Forms, Overlays, Navigation, Data display), install path (npm package, shadcn registry). It prints the create and install commands, the CSS entry with `@source`, `next.config` for Next on the npm path, `components.json` with the `@safe` registry (served origin, or `NEXT_PUBLIC_REGISTRY_URL`) and the `npx shadcn add @safe/…` command.

### Tasks and files

1. Content moves: `content/docs/{index,installation,theming,dark-mode,changelog}.mdx`, `foundations/`, `utilities/` → `content/docs/docs/`, with their own `meta.json`; the root `meta.json` lists `docs` and `components`; `components/index.mdx`; every internal link updated. `scaffold-pages.ts` writes `index` first in the components `meta.json`.
2. Shell: `src/app/(site)/layout.tsx`, `site.css` (was `(docs)/docs.css`), `src/components/site/*` (header, nav, mobile menu, search box, brand button), `src/lib/site.ts` (nav items, GitHub URL, section trees). The `(docs)` group goes away.
3. Section routes: `src/app/(site)/docs/**` and `src/app/(site)/components/**`, sharing `src/components/docs-page.tsx`.
4. Pages: `src/app/(site)/page.tsx` with `src/components/home/*`, `typeset/page.tsx` with `src/components/typeset/*`, `create/page.tsx` with `src/components/create/*`, and `src/components/docs/component-grid.tsx`.
5. `llms.txt` lists the source pages plus Home, Typeset and Create; the search dialog suggests Home, Docs, Components, Typeset and Create when empty.
6. Tests: `pages.test.ts` (the components index is not a component page; every docs page sits under `docs/` or `components/`), a `site.test.ts` for the Create generator output, and the crawl (new routes, header nav on every page, mobile menu, Create output follows the options, Typeset sample text updates).
7. `AGENTS.md`, `README.md` and the Installation links for the new structure.

### Verification and acceptance

- type-check, lint, test, prettier, `build`, the crawl at the root and with `NEXT_PUBLIC_BASE_PATH=/safe-ui`, knip, and `git diff 5dba2e98 -- apps/web apps/web-tanstack packages/views` empty.
- No 404s, no console errors, header on every docs and site page, the hex/`oklch()` grep still empty.
- Screenshots, desktop light and dark: `/`, `/components/`, `/components/button/`, `/typeset/`, `/create/`, `/docs/`; mobile dark: `/` with the menu open. Reviewed by eye until the home page reads as a product landing, not a Storybook.

### Redesign implementation notes

- The plan held. Deviations and details:
  - On mobile, the Fumadocs section bar (with "Open Sidebar") stays under the site header, because it is the only way to reach the Docs and Components sidebars there. Its own search and theme controls are off.
  - The root content `meta.json` is titled "Safe UI", so search breadcrumbs read "Safe UI › Components › Button".
  - Client-rendered code (Create, Typeset, the home install card, the registry snippet) uses Fumadocs' `DynamicCodeBlock`, which highlights with shiki in the browser; server pages keep `ServerCodeBlock`.
  - Component index thumbnails are lazily loaded live previews of each first story, scaled to 50%. The Avatar thumbnail triggers the same allowlisted broken-image request as its story.
  - Base UI puts a radio's `id` on its hidden native input, so the Create option cards are whole `<label>`s and the crawl clicks the label.
  - `packages/ui/README.md` points at the moved Installation page (`content/docs/docs/installation.mdx`).
- Verification after the last change: type-check, lint, test (39), prettier, `build`, `registry.json` current, knip, the hex/`oklch()` grep empty, the wallet diff empty, and the crawl passes at the root and from `/safe-ui/` (183 tests each: every site, docs and preview page with the header and its six nav items, the components filter, search, theme toggle, copy, the mobile menu sheet, Create output following framework, preset and install path, Typeset sample text).
