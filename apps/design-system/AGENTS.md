# Design system docs site guidelines

`@safe-global/design-system` is the Safe UI docs site and shadcn registry: a Next 16 static export (`output: 'export'`) with Fumadocs and Tailwind CSS v4. It documents [`packages/ui`](../../packages/ui/AGENTS.md) ([spec](../../specs/005-safe-ui-design-system/spec.md)).

## Rules

- **Consume `@safe-global/ui` like an outside app.** Import its public subpaths (`@safe-global/ui/primitives/button`, `@safe-global/ui/components/data-table`, `@safe-global/ui/styles.css`, `@safe-global/ui/eslint`), never the deprecated flat keys (`@safe-global/ui/button`), never relative `packages/ui` paths. Never import `@safe-global/views`, and never use `.shadcn-scope`, `scoped.css` or `ShadcnProvider` outside the prose that explains them.
- **Never copy values.** Colours, sizes and token names come from the generated data; no hex or `oklch()` value lives in `src/` or `content/`.
- **Stay host-agnostic.** No host-specific files (deploy, redirect or header config, custom-domain files) and no host name in the source. The base path and URLs come from the env variables below.
- **Never edit a story to fix the docs.** The stories are the wallet's visual baseline. Fix previews in `src/lib/preview-config.ts` or the docs components.
- Previews load only `preview.css` (Tailwind + `@safe-global/ui/styles.css`), so they show exactly what a consumer gets. The docs chrome adds the Fumadocs CSS.

## Site structure

| Route                           | Source                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `/`                             | `src/app/(site)/page.tsx`: hero, showcase built inline with `@safe-global/ui`, features |
| `/docs/…`                       | `content/docs/docs/**` in the Docs sidebar (`/docs/installation/` is Get started)       |
| `/components/`, `/components/…` | `content/docs/components/**`: the filterable index and one page per component           |
| `/typeset/`, `/create/`         | `src/app/(site)/{typeset,create}/page.tsx` with `src/components/{typeset,create}/*`     |
| `/preview/<component>/<story>/` | `src/app/(preview)/**`: bare story pages that only load the consumer CSS                |

- Every page under `(site)` gets the sticky header from `src/components/site/site-header.tsx`; the nav items live in `src/lib/site.ts`.
- One Fumadocs source holds both content folders; `src/components/section-layout.tsx` gives each section its own sidebar.
- Safe green is `--color-static-text-brand`. Wrap a `Button` in `<span className="brand">` to make it green, never restyle it with `className`. Demo content (addresses, amounts) lives in this app only, never in `packages/ui`.

## Generated vs hand-written

| Path                                                                           | What                                                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `content/docs/{docs,components}/**/*.mdx`, `meta.json`                         | Hand-written pages. Component pages are thin MDX over generated data                          |
| `src/components/docs/*`                                                        | Hand-written MDX components (`ComponentPreview`, `ComponentProps`, `TokenTable`, …)           |
| `src/scripts/*.ts`                                                             | Generators and their `node --test` tests                                                      |
| `registry.json`                                                                | **Generated and committed** by `src/scripts/registry.ts`; `registry.test.ts` fails when stale |
| `src/generated/`, `.source/`, `registry/safe/`, `public/r/`, `public/preview/` | Generated at build time, gitignored                                                           |
| `mock-assets/`, `src/app/fonts/`                                               | Copies of the Storybook mock images and the DM Sans files from `apps/web` (read-only copies)  |

`yarn generate` writes the story index and per-component preview modules, the Code tab sources, the props (`react-docgen-typescript`), the tokens, the Do/Don't rules and the icon list into `src/generated/`, then runs `fumadocs-mdx`.

## Adding a page

- **A new component:** add it to `packages/ui` with its export key and a story, then run `yarn workspace @safe-global/design-system scaffold:pages`. Fill in the frontmatter `description`, the usage notes and the accessibility notes (facts from the Base UI or upstream page; link it when unsure). Keep the seven sections: preview, Installation, Usage, Examples, Props, Accessibility, Do / Don't. Run `registry:build` and commit `registry.json`.
- **A new story** needs no docs change: the first story is the top preview, the others are Examples. Tag a story `docs-hidden` to keep it out.
- **Other docs pages:** add the MDX file under `content/docs/docs/` and list it in that folder's `meta.json`. A new top-level route also needs an entry in `NAV_ITEMS` or `SITE_PAGES` (`src/lib/site.ts`) and in the crawl.
- In MDX, escape braces in prose (`Safe\{Wallet\}`).

## Env variables

All optional; never create or edit a `.env` file.

| Variable                   | Default       | Effect                                                  |
| -------------------------- | ------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_PATH`    | empty         | Serve the site from a subfolder, e.g. `/safe-ui`        |
| `NEXT_PUBLIC_ASSET_PREFIX` | the base path | Serve `_next/` assets from another origin or path       |
| `NEXT_PUBLIC_SITE_URL`     | empty         | Absolute URLs in metadata and `llms.txt`                |
| `NEXT_PUBLIC_REGISTRY_URL` | served origin | The `{name}` URL shown in the `components.json` snippet |

## Checks

```bash
yarn workspace @safe-global/design-system type-check
yarn workspace @safe-global/design-system lint
yarn workspace @safe-global/design-system test       # generators, registry drift, page coverage
yarn workspace @safe-global/design-system prettier
yarn workspace @safe-global/design-system build   # → out/
yarn workspace @safe-global/design-system test:e2e   # Playwright crawl of out/ (serves it on :3100)
```

`test:e2e` needs Chromium; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use a preinstalled one. For a base-path crawl, copy `out/` to `<dir>/safe-ui` and run it with `BASE_URL=http://localhost:3101/safe-ui HOST_DIR=<dir>`.
