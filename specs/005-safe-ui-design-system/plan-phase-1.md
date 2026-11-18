# Plan: Safe UI, Phase 1 (tokens)

Spec: [spec.md](spec.md). Phase 1 per the spec's Rollout section: generate `tokens.css` from `packages/theme`, move `apps/web/src/styles/shadcn.css` into the package, have the wallet use `scoped.css`, and keep visual tests unchanged. Builds on [plan-phase-0.md](plan-phase-0.md) (including its Implementation notes and Follow-ups).

## Goal

When this phase is done:

- `@safe-global/ui` ships its own CSS: `./styles.css` (unscoped default), `./scoped.css` (opt-in `.shadcn-scope` variant) and `./tokens.css`.
- Every token value lives once, in `packages/theme`. The token files in `packages/ui` are generated from it, and a CI test fails when they drift.
- The wallet (`apps/web`, `apps/web-tanstack`, the `apps/web` Storybook) loads `scoped.css` through its existing `apps/web/src/styles/shadcn.css` entry, and every resolved CSS value is the same as before.
- `packages/ui` has a standalone Storybook that uses the unscoped `styles.css`.

## Scope

- In `packages/theme`: one non-palette token module for the shadcn-named variables, a generator for the two token files and a script that writes them. `css-vars.ts` gets a byte-identical refactor so both generators share the web palette declarations.
- In `packages/ui/src/styles/`: the generated `tokens.css` and `tokens.scoped.css`, and the hand-written `tailwind-theme.css`, `styles.css` and `scoped.css`. Plus the `exports` keys, CSS dependencies (`tailwindcss` peer, `tw-animate-css`, `shadcn`) and CSS tests.
- In `apps/web`: `src/styles/shadcn.css` becomes a thin app entry (Tailwind imports, `@import '@safe-global/ui/scoped.css'`, the app's `@source` lines). Tests that read `shadcn.css` are pointed at the package files, and a drift test is added.
- The standalone `packages/ui` Storybook (R17, deferred from Phase 0).
- `turbo.json` test inputs, `.prettierignore`, docs and agent guidance (including the stale `design.sync-variables` skill).

## Out of scope (and where it goes)

| Item                                                                                                                                                                             | Phase                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Any change to a rendered value, palette entry, MUI theme, Tamagui tokens or `vars.css` content                                                                                   | never in this phase     |
| oklch conversion of hex tokens (optional per R4; hex stays, and the existing oklch literals stay as they are)                                                                    | not planned             |
| Mapping the shadcn neutrals (`#171717`, `#e5e5e5`, …) onto palette entries. That is a design decision (D4) and changes the palette, so it changes the mobile outputs             | follow-up, design-owned |
| `apps/web/components.json` (its `tailwind.css` still points at `globals.css`), the import codemod, removing the re-exports, `./eslint`, pruning `tw-animate-css` from `apps/web` | 2                       |
| Chromatic deploy of the ui Storybook and a design-approved required check (R17)                                                                                                  | 2                       |
| Docs pages for install/theming/dark mode, the `registry:theme` item                                                                                                              | 3                       |
| `dist` build, so `@source` points at `dist` (R3 wording), vendoring `shadcn/tailwind.css`, publishing                                                                            | 4 (outside this effort) |

## Decisions

**D1. The shadcn-named tokens live in `packages/theme` as a non-palette section. They are not added to `ColorPalette`.**
`generateTamaguiColorTokens` and `generateTamaguiThemes` flatten the whole `ColorPalette` (`src/generators/tamagui.ts`), and the `Flatten` type carries every key into the Tamagui token types. `generateMuiTheme` reads the palette too. A new palette key would add mobile tokens and change the theme types, and the spec says mobile shares tokens only through what exists today (D5). Most shadcn values (the Tailwind neutral scale, the Figma yellow warning set, the z-index layers, the radius, the chart oklch values) also have no palette counterpart.

So a new `packages/theme/src/tokens/ui.ts` holds `uiTokens = { light, dark }`. It's an ordered map from CSS variable name (without `--`) to its value string, built from every declaration in today's `.shadcn-scope` and `.dark.shadcn-scope, .shadcn-scope.dark` blocks: same names, same order, same value strings, including the `var(--…)` references. Nothing imports it except the new generator, so the MUI, Tamagui and `vars.css` outputs don't change (acceptance check 9 proves it).

This meets R4 and SC5: the values have one home in `packages/theme`, and the CSS is generated from it. Two dark values are already documented as palette values: `--destructive` is "brand dark error.main" and `--accent-success` is "brand dark success.main". They're derived from the web dark palette, lowercased, so the generated string stays `#ff5f72` / `#00b460` and those hexes stop living in two places. Other matches (`#12ff80`, `#121312`) are left literal for the design follow-up, because picking which palette entry they mean is a design call. Rationale comments move into `ui.ts` as one-line comments, keeping the Figma node IDs. The generated CSS carries only a header.

**D2. Two generated token files, and both are committed.**

- `packages/ui/src/styles/tokens.scoped.css` is for the wallet. It holds only the shadcn-named variables, on `.shadcn-scope` and `.dark.shadcn-scope,\n.shadcn-scope.dark`: the same selectors and specificity as today. It doesn't declare the theme's `--color-*` palette variables. The wallet keeps getting those from `vars.css` on `:root` / `[data-theme='dark']`, exactly as now. Redeclaring them under `.dark` would change values wherever `data-theme` and the scope's `dark` class disagree.
- `packages/ui/src/styles/tokens.css` (exported as `./tokens.css`) is for everyone else and is self-contained. `:root` holds the web palette `--color-*` and `--space-*` declarations (the same ones `vars.css` has under `:root`) followed by the light shadcn-named variables. `.dark` holds the dark palette `--color-*` declarations followed by the dark shadcn-named variables. Self-contained matters for two reasons. The shadcn tokens reference palette variables (`--sidebar: var(--color-background-paper)`, `--warning-subtle: var(--color-warning-background)`, …). And components and the `@theme inline` block use them directly (`--color-primary-main`, `--color-info-background`, `--color-success-background`, …), so without them a consumer outside the wallet would get unresolved colors.

Both files come from one data source, so their shared declarations are equal by construction. A test checks this anyway (T2). The generator lowercases hex in its output and emits exactly the formatting Prettier would produce. So the drift test can compare exact strings, and `prettier --check` passes on the committed files. The header is `/* Generated from @safe-global/theme (yarn workspace @safe-global/theme generate:ui-tokens). Do not edit. */`. It must not contain the text `.shadcn-scope`, because existing tests find blocks with `indexOf`.

**D3. Hex stays.** R4 makes oklch optional and forbids changing rendered colors. Converting to oklch round-trips with rounding, so it can't be guaranteed equal. The existing `oklch(…)` literals (charts, `--icon-brand`, `--icon-hover`) are copied as they are.

**D4. CSS layout in the package, and what the app keeps.**

```
packages/ui/src/styles/
  tailwind-theme.css   # hand-written: @import 'tw-animate-css'; @import 'shadcn/tailwind.css'; @custom-variant dark; @theme inline {…}
  tokens.css           # GENERATED, unscoped, exported ./tokens.css
  tokens.scoped.css    # GENERATED, .shadcn-scope, internal
  styles.css           # @import './tailwind-theme.css'; @import './tokens.css'; @layer base { upstream shadcn base }
  scoped.css           # @import './tailwind-theme.css'; @import './tokens.scoped.css'; @layer base { today's scoped preflight, verbatim }
```

- `tailwind-theme.css` holds today's `@custom-variant dark (&:is(.dark *))` and the whole `@theme inline` block, verbatim. That covers `--font-sans`, every `--color-*` mapping, `--ease-soft` and the `--radius-*` scale. These are mappings and Tailwind scale settings, each written once, so R4's "two places" rule doesn't apply. Generating the radius scale from `tokens/radius.ts` is left out, because those px values are a different (MUI/Tamagui) scale.
- **Neither `styles.css` nor `scoped.css` imports Tailwind itself.** The app owns `@import 'tailwindcss'` (or the wallet's `theme.css` + `utilities.css` without preflight) and its `@source` lines. Three reasons:
  - A second `tailwindcss` import would duplicate output.
  - The wallet has to skip preflight to coexist with MUI.
  - `@source` paths depend on where the consumer's `node_modules` is.

  The consumer entry is:

  ```css
  @import 'tailwindcss';
  @import '@safe-global/ui/styles.css';
  @source '../node_modules/@safe-global/ui/src'; /* dist from Phase 4 */
  ```

- `styles.css` base layer is upstream shadcn's: `* { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; }`. `scoped.css` keeps the current `@layer base` block from `shadcn.css` unchanged, including the `[hidden]` rule, the box-model reset and `@apply outline-ring/50`.
- `scoped.css` depends on the host providing the theme's `--color-*` variables on `:root` (the wallet's `vars.css`). This is documented in the README. Making `scoped.css` self-contained for another MUI app is a follow-up.
- `apps/web/src/styles/shadcn.css` stays as the wallet's Tailwind entry, at the same path. So `_app.tsx`, `apps/web-tanstack/src/routes/__root.tsx`, `.storybook/shadcn.ts` and the two CSS-module `@reference` lines don't change. Its new content is:
  ```css
  @import 'tailwindcss/theme.css';
  @import 'tailwindcss/utilities.css';
  @import '@safe-global/ui/scoped.css';

  @source '../';
  @source '../../../../packages';
  ```
  The emitted order stays Tailwind theme → utilities → tw-animate → shadcn variants → tokens → scoped base layer. The emitted CSS should be identical, and acceptance check 6 proves it.

**D5. Export keys and dependencies (R1, R2).** `exports` gains `"./styles.css": "./src/styles/styles.css"`, `"./scoped.css": "./src/styles/scoped.css"` and `"./tokens.css": "./src/styles/tokens.css"`. `tokens.scoped.css` and `tailwind-theme.css` are internal and reached by relative `@import`. Plain string targets resolve under Tailwind's resolver (`style` condition) in `@tailwindcss/postcss` (Next, the Storybook webpack build) and `@tailwindcss/vite` (web-tanstack, the ui Storybook). `sideEffects: ["*.css"]` already covers these files.

- `peerDependencies`: `tailwindcss ^4.1.18`.
- `dependencies`: `tw-animate-css ^1.4.0` and `shadcn ^3.7.0`, the same ranges as `apps/web`. The bare `@import`s must resolve from `packages/ui`, and depending on `shadcn` for `shadcn/tailwind.css` is the upstream convention. Phase 4 may vendor that file to avoid shipping the CLI's dependency tree.

**D6. The generator lives in `theme`, the output in `ui`, and the wallet never imports `theme` into `ui`.**

- `packages/ui` keeps zero `@safe-global/*` dependencies (Phase 0 D4, and publishable later).
- `packages/theme/scripts/generate-ui-tokens.ts` writes both files into `packages/ui/src/styles/`, resolving the path from `import.meta.url`. It runs through `yarn workspace @safe-global/theme generate:ui-tokens`, using `npx -y tsx`, the same runner as `apps/web`'s `css-vars`.
- `vars.css` keeps its own command (`yarn workspace @safe-global/web css-vars`), and it must regenerate byte-identical (acceptance check 9).

**D7. The SC5 drift test runs in CI, so it lives in `apps/web`.** `packages/AGENTS.md` says theme tests run in no CI workflow. `apps/web` jest runs in `web-unit-tests` on every PR, and `apps/web` already imports `@safe-global/theme` and depends on `@safe-global/ui`. So `apps/web/src/styles/generatedCss.test.ts` asserts two things:

- `generateUiTokensCSS()` and `generateUiScopedTokensCSS()` equal the committed files exactly. The files are read via `path.dirname(require.resolve('@safe-global/ui/package.json'))`.
- `generateCSSVars()` equals `vars.css` after normalisation: lowercase, `"`→`'`, collapsed whitespace. Prettier is skipped in the test.

The failure message names the regeneration command. This also closes today's gap: nothing checks `vars.css` for drift now (it is in sync as of `342b20ae`). `packages/theme` also gets its own unit tests for the generator (the local gate). `turbo.json` `tasks.test.inputs` gains `$TURBO_ROOT$/packages/theme/src/**`, so a palette edit invalidates the cached `web` test, following the Phase 0 pattern for `ui`/`views`.

**D8. Standalone `packages/ui` Storybook is in scope. It sits next to the `apps/web` one and is not composed with it.**

- `packages/ui/.storybook/` uses `@storybook/react-vite` with `@tailwindcss/vite`. Its stories glob is `../src/**/*.stories.@(ts|tsx)`, which doesn't match `drawer.stories.test.tsx`. Its CSS entry is `.storybook/storybook.css` (`@import 'tailwindcss'; @import '../src/styles/styles.css'; @source '../src';`). Theme switching uses `withThemeByClassName` from `@storybook/addon-themes` (`light: ''`, `dark: 'dark'` on `<html>`). There's no `ShadcnProvider`, MUI or MSW, so it shows the default unscoped path a new consumer gets.
- `apps/web` Storybook keeps rendering the same story files with the wallet's scoped CSS. It stays the wallet's visual baseline (Argos, `test:storybook`, the render sweep).
- No `refs` composition, so the two `index.json` files never merge and duplicate story IDs can't collide. No visual test points at the ui Storybook.
- Stories don't change, so `apps/web` story IDs don't change (acceptance check 7).
- Fonts: the package doesn't ship DM Sans, so the ui Storybook falls back to `sans-serif`. Font delivery is a follow-up, shared with the Phase 3 docs site.
- CI deploy (Chromatic) is Phase 2. In this phase it's a local build, plus `scripts.build-storybook` for later CI.

**D9. Tests that read `shadcn.css` move with what they test.**

- `apps/web/src/styles/shadcnPreflight.test.ts` (the `[hidden]` rule) moves to `packages/ui/src/styles/styles.test.ts` and reads `scoped.css`.
- `semanticContrast.test.ts` reads `--foreground` from `tokens.scoped.css`. `walletModalZIndex.test.ts` reads `--z-above-onboard` / `--z-picker` from `tokens.scoped.css`. Both stay in `apps/web`, because they compare against app files (`vars.css`, `onboard.css`, `wallets.ts`). Both resolve the package directory with `require.resolve('@safe-global/ui/package.json')`, not a `../../../../packages` path.

**D10. Equality is checked mechanically, at four levels** (T0 baseline, T7 compare):

- (a) declarations: generated scoped tokens vs the base `shadcn.css` blocks
- (b) compiled CSS: web-tanstack `dist` CSS, plus the Next `out` CSS when the build runs
- (c) computed custom-property values in the built `apps/web` Storybook, light and dark, inside `.shadcn-scope`
- (d) the Phase 0 screenshot sweep and story-ID diff

Plus a hash of every `packages/theme` generator output (MUI palettes, Tamagui tokens/themes, `vars.css`).

**D11. Commits.** Suggested sequence:

1. `refactor(theme): share web palette declarations in css-vars`
2. `feat(theme): generate safe ui tokens css`
3. `feat(ui): ship styles, scoped and tokens css`
4. `refactor(web): load ui scoped.css from the shadcn entry`
5. `feat(ui): add standalone storybook`
6. `docs: token workflow for packages/ui`

Every commit compiles and passes tests. Commit 3 includes the generated files.

## Tasks

Prefix every yarn command with `export COREPACK_NPM_REGISTRY=https://registry.npmjs.org &&`, and Storybook builds with `NODE_OPTIONS=--max-old-space-size=8192`. `$SCRATCH` is the session scratchpad and `$BASE` is the commit the work starts from (`git rev-parse HEAD` before T1).

### T0. Capture the baseline (on `$BASE`, before any edit)

```bash
git show $BASE:apps/web/src/styles/shadcn.css > $SCRATCH/shadcn.before.css
# web Storybook: webpack build (run after any :vite build, which writes to the same dir)
yarn workspace @safe-global/web build-storybook --output-dir storybook-static
jq -r '.entries | keys[]' apps/web/storybook-static/index.json | sort > $SCRATCH/story-ids.before
npx -y http-server apps/web/storybook-static -p 4000 -s &
# screenshot sweep, both runs from plan-phase-0 note 9 (filtered, and all 208 ui cells with SKIP_SNAPSHOT_TAG ignored via a temporary uncommitted copy of scripts/storybook)
yarn workspace @safe-global/web storybook:sweep -- --base=http://localhost:4000 --filter=ui-,design-system --shots=$SCRATCH/shots-before --manifest=$SCRATCH/manifest.before.json
# computed values (script below)
node $SCRATCH/dump-tokens.mjs http://localhost:4000 > $SCRATCH/tokens.before.json
# compiled CSS
yarn workspace @safe-global/web-tanstack build && npx prettier --parser css apps/web-tanstack/dist/assets/*.css > $SCRATCH/tanstack.before.css
# optional, long: yarn workspace @safe-global/web build && npx prettier --parser css apps/web/out/_next/static/css/*.css > $SCRATCH/next.before.css
# theme outputs
# a temporary packages/theme/src/zz-dump.test.ts (deleted right after, never committed) that writes JSON of
#   generateCSSVars(), generateTamaguiTokens(), generateTamaguiThemes(), generateMuiTheme('light'|'dark').palette
# to $SCRATCH/theme-outputs.before.json; run with: (cd packages/theme && npx jest src/zz-dump.test.ts)
```

`$SCRATCH/dump-tokens.mjs` (scratch only) uses Playwright (`chromium` from `playwright`, already installed). For every story ID starting with `ui-` in `index.json`, in both `globals=theme:light` and `globals=theme:dark`, it opens `iframe.html?id=<id>&viewMode=story&globals=theme:<mode>` and waits for `.shadcn-scope`. Then it records:

- `getComputedStyle(el).getPropertyValue(name).trim()` for every custom-property name declared in the two token blocks of `shadcn.before.css`, plus every `--color-*` name in `vars.css`
- for each of those names, the resolved `background-color` of a temporary child with `style="background-color: var(<name>)"`, which normalises color syntax

Output is `{ [storyId]: { [mode]: { [name]: [raw, resolved] } } }`, sorted.

### T1. `packages/theme`: token data, generator, script, tests

1. `src/generators/css-vars.ts`: extract `export function generateWebVarDeclarations(): { light: string[]; dark: string[] }`. It returns unindented `--name: value;` lines: light is the web light palette plus spacing, dark is the web dark palette. The `webLightPalette` / `webDarkPalette` overrides move with it, unchanged. Rewrite `generateCSSVars()` on top of it with **byte-identical** output. Gate: rerun `yarn workspace @safe-global/web css-vars` and `git diff --exit-code apps/web/src/styles/vars.css`.
2. New `src/tokens/ui.ts`: `export const uiTokens: { light: Readonly<Record<string, string>>; dark: Readonly<Record<string, string>> }`.
   - Transcribe every declaration from the two token blocks of `apps/web/src/styles/shadcn.css` at `$BASE`, in order, with the value strings unchanged.
   - Dark `destructive` and `accent-success` come from the web dark palette (`error.main`, `success.main`), lowercased, per D1.
   - Rationale comments become one line each, with the Figma node IDs kept.
   - Don't export it from `src/tokens/index.ts`. Mobile has no use for it.
3. New `src/generators/ui-css.ts`:
   - `export function generateUiScopedTokensCSS(): string` emits the header, `.shadcn-scope { …light }` and `.dark.shadcn-scope,\n.shadcn-scope.dark { …dark }`.
   - `export function generateUiTokensCSS(): string` emits the header, `:root { …webLight decls, …light }` and `.dark { …webDark decls, …dark }`.
   - Both lowercase `#[0-9A-Fa-f]+` in the values they emit. Formatting is Prettier's: 2-space indent, a blank line between rules, a trailing newline.
4. New `scripts/generate-ui-tokens.ts`: writes both strings to `../../ui/src/styles/tokens.css` and `tokens.scoped.css`, resolved from `import.meta.url`. `package.json` gets `"generate:ui-tokens": "npx -y tsx scripts/generate-ui-tokens.ts"`.
5. New `src/generators/ui-css.test.ts`. It asserts:
   - the scoped output's light/dark declarations equal `uiTokens` in order
   - the unscoped output contains the same shadcn declarations, and its palette part equals `generateWebVarDeclarations()` lowercased
   - the output has no uppercase hex and no `.shadcn-scope` text before the first rule, and ends with `\n`
   - dark `--destructive` / `--accent-success` follow the palette, by temporarily reading the palette value
6. `src/generators/css-vars.test.ts`: add one case asserting that `generateCSSVars()` is assembled from `generateWebVarDeclarations()`, so a refactor can't fork them.

### T2. `packages/ui`: CSS files, exports, dependencies, tests

1. New `src/styles/tailwind-theme.css`, `styles.css` and `scoped.css` per D4. Content is moved verbatim from `$BASE`'s `shadcn.css`; only the import lines and the unscoped base layer are new.
2. Run `yarn workspace @safe-global/theme generate:ui-tokens` (after T1) to create `src/styles/tokens.css` and `tokens.scoped.css`. Check both with `yarn workspace @safe-global/ui prettier`.
3. `package.json`:
   - the D5 `exports` keys
   - `peerDependencies.tailwindcss ^4.1.18`
   - `dependencies`: `tw-animate-css ^1.4.0`, `shadcn ^3.7.0`
   - `devDependencies`: `tailwindcss ^4.1.18`, `@tailwindcss/vite ^4.3.3`, `vite 8.3.5`, `@storybook/react-vite ^10.6.5`, `@storybook/addon-themes ^10.6.5`, `@storybook/addon-docs ^10.6.5` (all already in the lockfile at these versions)
   - `scripts`: `"storybook": "storybook dev -p 6007"`, `"build-storybook": "storybook build --quiet"`

   Then `yarn install` and `yarn constraints`. Add any peer that `yarn install` warns about (YN0002), such as `@vitejs/plugin-react`, at the repo's existing range.

4. `src/components/overlay.ts`: fix the comment's path (`styles/shadcn.css` → `src/styles/tokens.scoped.css`, source `packages/theme/src/tokens/ui.ts`).
5. New `src/styles/styles.test.ts` (D9). It asserts:
   - `scoped.css` has the `.shadcn-scope [hidden]:where(:not([hidden='until-found']))` rule with `display: none !important`, moved from `apps/web/src/styles/shadcnPreflight.test.ts`
   - every shadcn declaration in `tokens.scoped.css` appears with the same value in `tokens.css` (light → `:root`, dark → `.dark`)
   - every `var(--x)` in `tailwind-theme.css`, and every `var(--color-…)` in `src/components/**/*.tsx`, is declared in `tokens.css` or defined in the `@theme inline` block. This proves `styles.css` is self-contained.
   - every bare `@import` in `src/styles/*.css` is a `dependencies`/`peerDependencies` entry, and every relative one stays in `src/styles`
   - `styles.css` and `scoped.css` don't import `tailwindcss`

   `package-exports.test.ts` already checks that the new export targets exist.

### T3. `apps/web` and repo wiring (paths per D2/D4, so this can run alongside T1/T2)

- `apps/web/src/styles/shadcn.css`: replace with the D4 entry (its five lines plus a one-line comment that tokens live in `@safe-global/ui`).
- Delete `apps/web/src/styles/shadcnPreflight.test.ts` (moved in T2.5).
- `apps/web/src/styles/semanticContrast.test.ts`: read the `shadcn` blocks from `<ui>/src/styles/tokens.scoped.css`, with `<ui>` resolved from `@safe-global/ui/package.json`.
- `apps/web/src/hooks/wallets/__tests__/walletModalZIndex.test.ts`: `SHADCN_CSS` becomes `tokens.scoped.css` (same resolution), and the header comment names it.
- New `apps/web/src/styles/generatedCss.test.ts` (D7). If jest can't resolve `@safe-global/theme/generators/*`, import by relative path the way `apps/web/scripts/css-vars.ts` does.
- Comment-only path updates: `apps/web/src/hooks/wallets/wallets.ts` (line 34), `apps/web/src/services/onboard/accountSelectAlert.ts` (lines 16–17), `apps/web/.storybook/shadcn.ts` (header).
- `turbo.json`: add `"$TURBO_ROOT$/packages/theme/src/**"` to `tasks.test.inputs`.
- `.prettierignore`: add `packages/ui/storybook-static`. The ui `prettier` script passes this file as `--ignore-path`, so `.gitignore` doesn't apply.

### T4. Standalone ui Storybook (D8)

- New `packages/ui/.storybook/main.ts`:
  - `framework: '@storybook/react-vite'` and `stories: ['../src/**/*.stories.@(ts|tsx)']`
  - `addons: ['@storybook/addon-themes', '@storybook/addon-docs']` and `core.disableTelemetry: true`
  - `viteFinal` adds `tailwindcss()` from `@tailwindcss/vite`
- New `packages/ui/.storybook/preview.tsx`: imports `./storybook.css`, uses the `withThemeByClassName` decorator and `options.storySort.order: ['UI']`.
- New `packages/ui/.storybook/storybook.css` per D8.
- `packages/ui/tsconfig.json`: add `.storybook/*.ts` and `.storybook/*.tsx` to `include`. If the native TS 7 type-check rejects something in the Storybook types, exclude it instead and say so.

### T5. Docs and agent guidance (call these out in the PR)

- `packages/ui/AGENTS.md`:
  - Replace "tokens and CSS still live in apps/web" with the D4 layout.
  - The token files are generated, so never hand-edit them: edit `packages/theme/src/tokens/ui.ts` (or the palettes), then run `generate:ui-tokens`.
  - `styles.css` and `scoped.css` hold no values.
  - Add the ui Storybook and the new checks.
- `packages/ui/README.md`: a "Styles" section covering:
  - the consumer entry from D4 (`styles.css`, the `@source` path, `.dark` class for dark mode)
  - `scoped.css` for MUI apps, and its `vars.css` prerequisite
  - `tokens.css` for token-only use

  Also say that stories render in both Storybooks.

- `packages/AGENTS.md`: "packages/theme" section. Add `src/tokens/ui.ts` and `yarn workspace @safe-global/theme generate:ui-tokens` to the workflow, and say the drift test in `apps/web` fails if either generated file is stale.
- `packages/theme/README.md` and `ARCHITECTURE.md`: add the `ui-css` generator, its outputs and the non-palette rationale (D1).
- `apps/web/AGENTS.md`: one line saying shadcn token values come from `packages/theme` via `@safe-global/ui/scoped.css`, so don't add tokens to `apps/web/src/styles/shadcn.css`.
- `.claude/skills/design.sync-variables/SKILL.md`: retarget from `globals.css` (stale) to `packages/theme/src/tokens/ui.ts`, plus `generate:ui-tokens` and the drift test. The mapping table stays.
- Root `AGENTS.md`: the `packages/ui/` row also mentions styles and tokens.

### T6. Verify (see below), then T7: compare against T0 (acceptance checks 5–9).

## Parallelization

| Group | Tasks (run together)                     | Files touched                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G0    | T0                                       | none (scratch only); on `$BASE`, before anything else                                                                                                                                                                                                     |
| G1    | **A:** T1                                | `packages/theme/{src/generators/css-vars.ts,css-vars.test.ts,ui-css.ts,ui-css.test.ts,src/tokens/ui.ts,scripts/generate-ui-tokens.ts,package.json}`                                                                                                       |
|       | **B:** T2.1, T2.3–T2.5                   | `packages/ui/src/styles/{tailwind-theme,styles,scoped}.css`, `packages/ui/src/styles/styles.test.ts`, `packages/ui/package.json`, `packages/ui/src/components/overlay.ts`, `yarn.lock`                                                                    |
|       | **C:** T3                                | `apps/web/src/styles/{shadcn.css,semanticContrast.test.ts,generatedCss.test.ts}`, deleted `shadcnPreflight.test.ts`, `walletModalZIndex.test.ts`, `wallets.ts`, `accountSelectAlert.ts`, `apps/web/.storybook/shadcn.ts`, `turbo.json`, `.prettierignore` |
|       | **D:** T4                                | `packages/ui/.storybook/*`, `packages/ui/tsconfig.json`                                                                                                                                                                                                   |
|       | **E:** T5                                | `packages/ui/{AGENTS,README}.md`, `packages/AGENTS.md`, `packages/theme/{README,ARCHITECTURE}.md`, `apps/web/AGENTS.md`, `AGENTS.md`, `.claude/skills/design.sync-variables/SKILL.md`                                                                     |
| G2    | T2.2 (one agent, after A and B)          | `packages/ui/src/styles/tokens.css`, `tokens.scoped.css` (generated)                                                                                                                                                                                      |
| G3    | T6 → T7 (sequential, after G2 and C/D/E) | none                                                                                                                                                                                                                                                      |

Ordering rules:

- Streams A–E touch disjoint files. B owns `packages/ui/package.json` for T4's scripts and devDependencies too, so D doesn't edit it.
- `yarn install` runs in B, after the `package.json` edit and before D's Storybook build.
- T1.1's byte-identical gate (`css-vars` + `git diff --exit-code vars.css`) has to pass before A continues.
- C's and B's tests only pass after G2, because they read the generated files. Agents in G1 run only their own type-check and lint.
- Only verification started after the last edit counts.

## Verification commands

From the repo root, with the corepack prefix (and `NODE_OPTIONS=--max-old-space-size=8192` for Storybook builds):

```bash
yarn install && yarn constraints

# theme (and every dependent's types: web, web-tanstack, views, mobile, tx-builder, drain-safe)
yarn workspace @safe-global/theme type-check
yarn workspace @safe-global/theme lint
yarn workspace @safe-global/theme test
yarn turbo run type-check --filter=...@safe-global/theme --force
yarn workspace @safe-global/web css-vars && git diff --exit-code apps/web/src/styles/vars.css
yarn workspace @safe-global/theme generate:ui-tokens && git diff --exit-code packages/ui/src/styles

# ui
yarn workspace @safe-global/ui type-check
yarn workspace @safe-global/ui lint
yarn workspace @safe-global/ui test
yarn workspace @safe-global/ui prettier
yarn workspace @safe-global/ui build-storybook

# views
yarn workspace @safe-global/views type-check
yarn workspace @safe-global/views lint

# web
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test --watchAll=false
yarn workspace @safe-global/web test:storybook --watchAll=false
yarn workspace @safe-global/web build-storybook:vite --output-dir $SCRATCH/sb-vite   # fails on $BASE too (phase 0 note 10); must fail the same way, not on CSS
yarn workspace @safe-global/web build-storybook --output-dir storybook-static
node scripts/verify.mjs --changed --workspace=web

# web-tanstack (Vite proof for the package CSS)
yarn workspace @safe-global/web-tanstack type-check
yarn workspace @safe-global/web-tanstack lint
yarn workspace @safe-global/web-tanstack test --watchAll=false
yarn workspace @safe-global/web-tanstack build
node scripts/verify.mjs --changed --workspace=web-tanstack

# mobile (theme changed; no palette/tamagui change, proven by acceptance check 9)
yarn workspace @safe-global/mobile type-check
# mobile tests: only required if check 9 shows any theme output difference (which this plan forbids)

# repo-level
yarn turbo run type-check lint test --filter=@safe-global/theme --filter=@safe-global/ui --filter=@safe-global/views --force
yarn knip:exports:web   # if it flags the new generator exports, add scripts/generate-ui-tokens.ts as a theme entry in knip.json
yarn prettier
# optional, long, recommended for this phase: yarn workspace @safe-global/web build
```

## Acceptance checks

1. `packages/ui/package.json` exports `./styles.css`, `./scoped.css` and `./tokens.css`, and `package-exports.test.ts` passes. `tailwindcss` is a peer, and `tw-animate-css` and `shadcn` are dependencies.
2. **No token value outside `packages/theme`.**
   - `grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|rgba\(' apps/web/src/styles/shadcn.css packages/ui/src/styles/{tailwind-theme,styles,scoped}.css` prints nothing.
   - The only hand-written values left in `tailwind-theme.css` are the `@theme inline` scale settings (`--font-sans`, `--ease-soft`, `--radius-*`).
3. **Drift fails the build.** Edit one value in `packages/theme/src/tokens/ui.ts` without regenerating: `yarn workspace @safe-global/web test --watchAll=false src/styles/generatedCss.test.ts` fails. It also fails after a hand edit to `tokens.css`, and after a palette edit without `css-vars`. Revert the edits.
4. `apps/web/src/styles/shadcn.css` is the D4 entry. `_app.tsx`, `__root.tsx`, `.storybook/shadcn.ts` and both `@reference` lines are unchanged (`git diff $BASE -- <those files>` shows comment-only changes at most).
5. **Declarations equal (D10a).** A scratch script parses `$SCRATCH/shadcn.before.css` and the new `tokens.scoped.css` with `postcss`. It compares the light and dark rules (selector text, then the ordered list of `[prop, value]`): they're identical. `:root`/`.dark` in `tokens.css` contain the same shadcn pairs, and their `--color-*`/`--space-*` pairs equal `vars.css` `:root`/`[data-theme='dark']` (lowercased).
6. **Compiled CSS equal (D10b).** `diff $SCRATCH/tanstack.before.css <(npx prettier --parser css apps/web-tanstack/dist/assets/*.css)` is empty. If it isn't, every hunk must be an _addition_ of a utility that Tailwind newly found in a scanned file (for example under `packages/theme/src` or `packages/ui/.storybook`), with no changed or removed rule and no reordering. Each hunk is listed in the PR. The same applies to `next.before.css` if the Next build ran.
7. **Story IDs unchanged.** `jq -r '.entries | keys[]' apps/web/storybook-static/index.json | sort | diff - $SCRATCH/story-ids.before` is empty.
8. **Computed values and pixels equal (D10c, D10d).**
   - Rerun `dump-tokens.mjs` against the new static build: `diff <(jq -S . $SCRATCH/tokens.before.json) <(jq -S . $SCRATCH/tokens.after.json)` is empty.
   - Rerun both sweeps from T0: the manifests are identical (rerun once on a mismatch, per phase 0 note 9).
   - Run the dump against the ui Storybook too (served from `packages/ui/storybook-static`, reading `:root` instead of `.shadcn-scope`). For every shadcn token, its `resolved` value in light and dark equals the wallet's. So the standalone path renders the same colors.
9. **Theme outputs unchanged.**
   - The T0 dump test, rerun after the change, gives a `theme-outputs.after.json` identical to before (MUI palettes, Tamagui tokens/themes, `generateCSSVars()`).
   - `git diff --exit-code apps/web/src/styles/vars.css` passes after `css-vars`.
   - `git diff --stat $BASE.. -- packages/theme/src/palettes apps/mobile` is empty.
10. Every command in "Verification commands" passes, except `build-storybook:vite`, which fails exactly as on `$BASE`. `yarn workspace @safe-global/ui build-storybook` succeeds. Opening a few stories (button, dialog, sidebar, badge) in light and dark shows themed components, with portalled content (dialog, popover) styled.
11. Isolation still holds. Phase 0 acceptance checks 3 and 4 (no `next`/`@safe-global/*`/`@/` imports, no `@safe-global/views` text in `packages/ui`) still print nothing, and `packages/ui/package.json` has no `@safe-global/*` dependency.

## Requirement traceability

| Req     | Phase 1 status                                                                                                                                                                                       | Rest goes to                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| R1      | **Partial**: adds `./styles.css`, `./tokens.css`, `./scoped.css` to the Phase 0 keys                                                                                                                 | `./eslint` → P2                                                                 |
| R2      | **Partial**: `tailwindcss` peer added; CSS runtime deps declared                                                                                                                                     | tsup/tsdown, `.d.ts`, banners, possible vendoring of `shadcn/tailwind.css` → P4 |
| R3      | **Addressed**: `styles.css` (`@theme inline`, tokens, dark variant, tw-animate-css), opt-in `scoped.css` used by the wallet, unscoped `:root`/`.dark` default; `@source` consumer step in the README | docs page → P3; `@source` path `src`→`dist` → P4                                |
| R4      | **Addressed**: values in `packages/theme` (palettes + `tokens/ui.ts`), CSS generated by extending the css-vars pipeline; hex kept, no rendered change                                                | design-owned mapping of neutrals onto the palette → follow-up                   |
| R5      | **Addressed for CSS too**: the package CSS builds under Next/postcss, webpack Storybook and Vite (web-tanstack, ui Storybook)                                                                        | non-wallet app proof → P3/P4                                                    |
| R6      | **Partial**: stories now also render in the package's own Storybook                                                                                                                                  | docs reuse stories → P3                                                         |
| R7      | Deferred                                                                                                                                                                                             | P4 (outside this effort)                                                        |
| R8–R13  | Deferred                                                                                                                                                                                             | P3 (R13 hosting → P4)                                                           |
| R14     | Deferred                                                                                                                                                                                             | P2                                                                              |
| R15     | Unchanged                                                                                                                                                                                            | P3                                                                              |
| R16     | **Partial** (unchanged)                                                                                                                                                                              | P2 / P4                                                                         |
| R17     | **Partial**: standalone `packages/ui` Storybook on the default (unscoped) styles; `design.sync-variables` retargeted at the token source                                                             | Chromatic deploy + required design-approved check → P2                          |
| SC1     | Groundwork: self-contained `styles.css` + `tokens.css`, consumer steps in the README                                                                                                                 | P3 docs + P4 publish                                                            |
| SC2     | Maintained: no visual change (checks 5–8)                                                                                                                                                            | P2                                                                              |
| SC3/SC4 | Not in this phase                                                                                                                                                                                    | P3 (SC4 public URL → P4)                                                        |
| SC5     | **Addressed**: single source in `packages/theme`; `generatedCss.test.ts` fails on drift of `tokens.css`, `tokens.scoped.css` or `vars.css`, and runs in `web-unit-tests`                             | —                                                                               |

## Risks

1. **CSS `@import` of a workspace package does not resolve** in one pipeline (postcss in Next/webpack Storybook, `@tailwindcss/vite`). Plain string `exports` targets and the hoisted `node_modules` linker should work. All four builds are in the gate, and check 6 compares the output. The fallback is a relative import from `apps/web/src/styles/shadcn.css` to `../../../../packages/ui/src/styles/scoped.css`, recorded as a deviation.
2. **Cascade order changes** (imports moved into nested files). Check 6 (an exact compiled diff) catches reordering. D4 keeps the original sequence.
3. **Tailwind scans new files** under `@source '../../../../packages'` and emits extra utilities. These are harmless additions. Check 6 lists them, and nothing may be removed or changed.
4. **Two dark selectors.** The unscoped `tokens.css` keys palette variables to `.dark`, while `vars.css` uses `[data-theme='dark']`. The wallet never loads `tokens.css` (it uses the scoped file, which redeclares no palette variables), so nothing changes there. This is documented in the README.
5. **Generator formatting vs Prettier.** If Prettier would reformat the generated files, the drift test and `yarn prettier` disagree. The generator emits Prettier's format, and the verification runs both.
6. **Drift test not run.** Theme tests aren't in CI, so the SC5 test lives in `apps/web` (D7). The turbo test inputs gain `packages/theme/src/**`, so cached `web` runs see palette edits.
7. **Hidden consumers of `shadcn.css` text.** Three tests and three comments read or name it today (found by grep). A grep for `shadcn.css` after T3 must show only the entry file, its importers, the two `@reference` lines and docs.
8. **ui Storybook peers or TS 7** (react-vite, addon-themes, vite types). Missing peers get added at existing ranges. If TS 7 can't type-check `.storybook`, it is excluded from `tsconfig` and the deviation recorded. The ui Storybook isn't part of any visual baseline, so it can't break Argos.
9. **`shadcn` as a runtime dependency** pulls the CLI's dependencies into a future published package. That's acceptable while the package is private. Phase 4 decides whether to vendor the CSS.
10. **Agents editing the old places.** The stale `design.sync-variables` skill, `apps/web/AGENTS.md` and `packages/AGENTS.md` are updated in T5. The generated header and the drift-test message both name the command.

## Implementation notes

Deviations from the plan:

1. **`@source not` line in `apps/web/src/styles/shadcn.css`.** With `@source '../../../../packages'`, Tailwind scanned the new `packages/theme/src/tokens/ui.ts` and found three utility candidates in its quoted keys (`accent-foreground`, `accent-secondary`, `accent-secondary-foreground`). The compiled web-tanstack CSS gained those three rules. Check 6 would allow additions, but the entry now excludes the ui token sources (`@source not '../../../../packages/theme/src/**/ui*.ts'`, with a one-line comment): `tokens/ui.ts`, `generators/ui-css.ts` and its test, whose case table names `accent-secondary-foreground`, so the compiled CSS is byte-identical to the base, file hashes included. Excluding all of `packages/theme` was tried and rejected: it dropped `.text-secondary` and `.overline`, which the base build emits because theme files mention them.
2. **`packages/views/package.json`** gains `tailwindcss ^4.1.18` as a peer and dev dependency. `yarn install` warned (YN0002) that `views`, which depends on `@safe-global/ui`, did not provide the new `tailwindcss` peer. The other YN0002 (root `eslint` for `eslint-plugin-eslint-comments`) is pre-existing.
3. **Web palettes and palette references (review fix).** `webLightPalette` and `webDarkPalette` moved unchanged from `generators/css-vars.ts` to `src/palettes/web.ts`, which the palettes index does not export, so mobile never sees them. `css-vars.ts` and `tokens/ui.ts` both import them. Check 9's literal `git diff --stat $BASE.. -- packages/theme/src/palettes` therefore lists this new file. No palette value changed, and the MUI, Tamagui and `generateCSSVars()` outputs are still identical. `ui.ts` references every palette colour that has the same meaning, lowercased: light `card`/`popover`/`dialog` (`background.paper`), dark `primary` (`primary.main`), `dialog` (`background.paper`), `destructive` (`error.main`) and `accent-success` (`success.main`), plus `accent-secondary-foreground` in both themes (`staticColors.main`, the theme-independent brand ink). Matches with a different meaning stay literal: light `--background` `#ffffff` is shadcn's page canvas, not the paper surface (the wallet page is `background.default`). Light `--input` `#ffffff` is the field fill. Dark `--destructive-foreground` `#ffffff` is ink on red. Dark `--background` `#000000` equals dark `text.contrast`. The generated files did not change.
4. **Drift test message.** `generatedCss.test.ts` asserts a status string, so a failure prints `<file> is stale: run \`<command>\` and commit the result` instead of a long string diff.
5. **`scoped.css`** starts with a one-line comment saying what the opt-in variant is for.
6. **The commits** follow D11, with two splits so each prefix matches `docs/ai/git-conventions.md`: the `apps/web` test changes are a `tests:` commit, and the turbo input is a `chore:` commit. Every commit compiles.
7. **Environment.**
   - `yarn workspace @safe-global/web type-check` and `lint` run out of memory at Node's default heap here, on the base commit too (proven with the changes stashed and no warm `tsconfig.tsbuildinfo`). In this container the root `tsc` bin resolves to TypeScript 5.9, not the native 7 compiler. Every command ran with `NODE_OPTIONS=--max-old-space-size=8192`.
   - The scratch `dump-tokens.mjs` waits for `html.dark` before reading the ui Storybook in dark mode, because `withThemeByClassName` applies the class in an effect after the first render.
8. **Next production build** (optional in the plan) was not run. The web-tanstack `dist` CSS and the webpack Storybook build cover the two Tailwind pipelines.
9. **Results.** Checks 1–11 pass. Generated scoped tokens equal the base `shadcn.css` blocks (selectors and ordered pairs), and `tokens.css` palette pairs equal `vars.css`. The web-tanstack `dist` CSS is byte-identical (same file names and hashes). Story IDs (1606) are unchanged. Computed values for all 93 `ui-*` stories, light and dark, are identical, and the ui Storybook resolves every shadcn token to the same color as the wallet (10,788 comparisons, 0 differences). Both sweeps match the base hashes (24 filtered sheets, and all 208 cells in 63 sheets). The theme outputs (raw `generateCSSVars()`, Tamagui tokens/themes, MUI palettes) are identical. The drift test fails on a `ui.ts` edit, a hand edit of `tokens.css` and a palette edit without `css-vars`.
10. **Flaky test under load.** `node scripts/verify.mjs --changed --workspace=web` reported 7 timeouts in `SpendingLimitPolicyForm.test.tsx` while the screenshot sweep ran in parallel. The file is untouched by this phase, passes on its own (21/21), and passes in the full `yarn workspace @safe-global/web test` run.

## Follow-ups

- `type-check` scripts run `yarn run -T -B tsc`, and in this container that resolves to TypeScript 5.9 (`node_modules/typescript`), not the root `@typescript/native` 7 compiler, so `apps/web` type-check needs an 8 GB heap without a warm `tsbuildinfo`. Confirm which compiler CI runs and make the bin unambiguous.
- `scoped.css` relies on the host's `vars.css` for the `--color-*` palette; a self-contained scoped variant for another MUI app is open (D4).
- The `@source not` exclusion for `packages/theme/src/**/ui*.ts` in the wallet entry can go once the wallet scans `packages/ui` `dist` instead of the whole `packages` tree (Phase 4).
- Font delivery for the ui Storybook and the docs site (D8), and the design-owned mapping of the shadcn neutrals onto palette entries (D4 out of scope), are unchanged.
- The Next production build was not compared (optional in this plan).
- Phase 2 tooling cleanup: `packages/ui` is not in `knip.json`, so its new dependencies and devDependencies (Storybook, Vite, Tailwind, `shadcn`, `tw-animate-css`) go unchecked, and theme `lint` (`eslint src`) does not cover `scripts/generate-ui-tokens.ts`.
