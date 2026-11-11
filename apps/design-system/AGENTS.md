# Design system docs site guidelines

`@safe-global/design-system` is the Safe UI docs site and shadcn registry: a Next 16 static export (`output: 'export'`) with Fumadocs and Tailwind CSS v4. It documents [`packages/ui`](../../packages/ui/AGENTS.md) ([spec](../../specs/005-safe-ui-design-system/spec.md)).

## Rules

- **Consume `@safe-global/ui` like an outside app.** Import its public subpaths (`@safe-global/ui/button`, `@safe-global/ui/styles.css`, `@safe-global/ui/eslint`), never relative `packages/ui` paths. Never import `@safe-global/views`, and never use `.shadcn-scope`, `scoped.css` or `ShadcnProvider` outside the prose that explains them.
- **Never copy values.** Colours, sizes and token names come from the generated data; no hex or `oklch()` value lives in `src/` or `content/`.
- **Stay host-agnostic.** No host-specific files (deploy, redirect or header config, custom-domain files) and no host name in the source. The base path and URLs come from the env variables below.
- **Never edit a story to fix the docs.** The stories are the wallet's visual baseline. Fix previews in `src/lib/preview-config.ts` or the docs components.
- Previews load only `preview.css` (Tailwind + `@safe-global/ui/styles.css`), so they show exactly what a consumer gets. The docs chrome adds the Fumadocs CSS.

## Generated vs hand-written

| Path                                                                           | What                                                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `content/docs/**/*.mdx`, `meta.json`                                           | Hand-written pages. Component pages are thin MDX over generated data                          |
| `src/components/docs/*`                                                        | Hand-written MDX components (`ComponentPreview`, `ComponentProps`, `TokenTable`, …)           |
| `src/scripts/*.ts`                                                             | Generators and their `node --test` tests                                                      |
| `registry.json`                                                                | **Generated and committed** by `src/scripts/registry.ts`; `registry.test.ts` fails when stale |
| `src/generated/`, `.source/`, `registry/safe/`, `public/r/`, `public/preview/` | Generated at build time, gitignored                                                           |
| `mock-assets/`, `src/app/fonts/`                                               | Copies of the Storybook mock images and the DM Sans files from `apps/web` (read-only copies)  |

`yarn generate` writes the story index and per-component preview modules, the Code tab sources, the props (`react-docgen-typescript`), the tokens, the Do/Don't rules and the icon list into `src/generated/`, then runs `fumadocs-mdx`.

## Adding a page

- **A new component:** add it to `packages/ui` with its export key and a story, then run `yarn workspace @safe-global/design-system scaffold:pages`. Fill in the frontmatter `description`, the usage notes and the accessibility notes (facts from the Base UI or upstream page; link it when unsure). Keep the seven sections: preview, Installation, Usage, Examples, Props, Accessibility, Do / Don't. Run `registry:build` and commit `registry.json`.
- **A new story** needs no docs change: the first story is the top preview, the others are Examples. Tag a story `docs-hidden` to keep it out.
- **Other pages:** add the MDX file and list it in the folder's `meta.json`.
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
NODE_OPTIONS=--max-old-space-size=8192 yarn workspace @safe-global/design-system build   # → out/
yarn workspace @safe-global/design-system test:e2e   # Playwright crawl of out/ (serves it on :3100)
```

`test:e2e` needs Chromium; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use a preinstalled one. For a base-path crawl, copy `out/` to `<dir>/safe-ui` and run it with `BASE_URL=http://localhost:3101/safe-ui HOST_DIR=<dir>`.
