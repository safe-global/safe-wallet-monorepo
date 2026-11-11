# Plan: Safe UI, Phase 0 (extract)

Spec: [spec.md](spec.md). Phase 0 per the spec's Rollout section: create `packages/ui` (`@safe-global/ui`), move the generic components, `cn`, hooks and tests into it, cut the couplings in the coupling table, and have `views` re-export from `ui` so nothing breaks.

## Goal

When this phase is done, `@safe-global/ui` is a workspace package with no domain logic and no `next/*`. It holds all shadcn primitives, `cn`, the responsive hooks, `ShadcnProvider`, their tests and their stories. Every existing import path (`@safe-global/views/components/ui/*`, `@safe-global/views/utils/cn`, `@safe-global/views/hooks/use-mobile|use-tablet`, `@safe-global/views/components/common/iconStroke`) still resolves, through one-line re-export files. The wallet looks the same and every check passes.

## Scope

- New workspace `packages/ui` with an R1-shaped `exports` map that points at source, plus its own type-check, lint and jest setup.
- `git mv` of 52 component files, 19 tests, `table.module.css`, 53 story files (52 stories plus `drawer.stories.test.tsx`), `ShadcnProvider`, `cn`, `use-mobile`, `use-tablet`, the Figma Code Connect doc, the README and the design-system ESLint rules module.
- Cutting the couplings: the address-aware input, `next-themes` in sonner, `@safe-global/views/...` absolute imports, the `ICON_STROKE` import from `views/components/common`, and app-only test helpers (`@/tests/test-utils`, `next/link`).
- Re-export files in `views`, workspace dependencies, and wiring for the consumers (jest roots, tsconfig include, Next `transpilePackages`, both Storybook configs, the story-test generator, turbo inputs, two CI workflow lines).
- Pointing jest module mocks of the moved modules at `@safe-global/ui/*`, so mocks behave as they do today (see D7).
- Agent and docs guidance for the new package.

## Out of scope (and where it goes)

| Item                                                                                                                                                                                                                 | Phase                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `styles.css`, `tokens.css`, `scoped.css`, token generation, moving `apps/web/src/styles/shadcn.css`                                                                                                                  | 1                                                   |
| `tailwindcss` peer dependency (it only matters once the package ships CSS)                                                                                                                                           | 1                                                   |
| Standalone `packages/ui` Storybook                                                                                                                                                                                   | 1 at the earliest (needs tokens CSS in the package) |
| Codemod of app/views imports to `@safe-global/ui/*`, removing the re-exports, `./eslint` export, `packages/ui/components.json` (shadcn CLI inside the package), CODEOWNERS with a design group, pruning `views` deps | 2                                                   |
| Docs site and registry                                                                                                                                                                                               | 3                                                   |
| tsup/tsdown build, `.d.ts`, `'use client'` banners in output, publishing, license, changesets                                                                                                                        | 4 (outside this effort)                             |
| Any visual or token change                                                                                                                                                                                           | never in this phase                                 |

## Decisions

**D1. Exports point at source, with no build step in Phase 0 (R2).**
`exports` targets are `.ts`/`.tsx` files under `src/`. Every in-monorepo consumer (Next webpack, the Storybook webpack and Vite builders, Vite in `web-tanstack`, jest in both apps, TS `moduleResolution: bundler`) already compiles workspace source today: `views` is consumed exactly this way, through aliases. A `dist` build now would need watch tasks in dev or would break HMR, and it would force decisions on CSS modules and `'use client'` banners that only matter for publishing. The map's keys are the public contract and stay fixed. Phase 4 adds tsup/tsdown and swaps the values to `dist` through Yarn's `publishConfig.exports`, so in-repo consumers keep source. The package is `"private": true` until then.

**D2. Export map shape (R1).** There is no root barrel. These keys exist:

```jsonc
"exports": {
  "./accordion": "./src/components/accordion.tsx",
  // … one key per component file in src/components (52 in total, including "./overlay": "./src/components/overlay.ts")
  "./utils": "./src/lib/utils.ts",          // cn + ICON_STROKE
  "./hooks/*": "./src/hooks/*.ts",          // use-mobile, use-tablet
  "./provider": "./src/provider.tsx",       // ShadcnProvider, usePortalContainer, usePortalContainerElement
  "./package.json": "./package.json"        // Next transpilePackages resolves <pkg>/package.json
}
```

The keys are listed one by one, not as a `./*` pattern. A pattern would expose tests and internals, and R1 asks for one entry per component. A test (`src/package-exports.test.ts`) fails when a component file has no key or a key points at a missing file. `./styles.css`, `./tokens.css` and `./scoped.css` are left out until Phase 1 and `./eslint` until Phase 2. No placeholder files are added, because an empty stylesheet export would mislead consumers. `"sideEffects": ["*.css"]` keeps tree-shaking working (US1.2) while protecting `table.module.css`.

**D3. How consumers resolve it.** `@safe-global/ui: workspace:^` goes into the dependencies of `views`, `apps/web` and `apps/web-tanstack`. Resolution goes through the Yarn workspace symlink and the `exports` map. **No** tsconfig `paths`, jest `moduleNameMapper` or Vite alias is added. The subpaths don't mirror `src/`, so aliases would copy the export map into five configs and drift from it. `@safe-global/ui` is added to `transpilePackages` in `apps/web/next.config.mjs`, so Next always bundles it rather than externalising a `.tsx` file from `node_modules` during the static-export server pass. `apps/mobile` doesn't depend on `views` or `ui` (checked: no reference in `apps/mobile`), and nothing about mobile changes.

**D4. Internal imports are relative.** Consumers compile the source with their own resolver, so a package-internal alias (`@/…`, or `@safe-global/views/...`) wouldn't resolve for them. Every import inside `packages/ui/src` is relative or a third-party package. `packages/ui/tsconfig.json` sets `"paths": {}` to drop the inherited `@safe-global/*` aliases from `config/tsconfig/confs/base.json`, and lint bans `next`, `next/*`, `next-themes`, `@safe-global/*` and `@/*`.

**D5. Stories move now and keep rendering in the `apps/web` Storybook (R6, R17).** Stories move with their components, so a component and its story change in one place, and R6 is satisfied without a second move later. All 52 have an explicit `title`, so story IDs don't change, and Argos baselines, story links and `storySort` are untouched. They stay in the existing `apps/web` Storybook (both `.storybook` and `.storybook-vite`) through a new glob. A standalone `packages/ui` Storybook is deferred: today it would have to import `apps/web/src/styles/shadcn.css`, a dependency pointing the wrong way, from package to app. It belongs in Phase 1, once the tokens live in the package. `stories/design-system.stories.tsx` stays in `views`, because it composes app components (`@/components/common/*`, `react-hook-form`). `drawer.stories.test.tsx` moves next to its story. It keeps `import '@/tests/storybook-setup'` and runs under `apps/web`'s `test:storybook`. `packages/ui`'s own type-check, lint and jest exclude `*.stories.test.tsx`.

**D6. Tests move and run in two places.** `packages/ui` gets its own jest setup (shared preset, ts-jest transpile-only, `jest-fixed-jsdom`, polyfills copied from `apps/web/jest.setup.js`). That's the package's own gate (R6). `apps/web/jest.config.cjs` `roots` also gains `packages/ui/src`, the same way `packages/views/src` is listed today, so CI (`web-unit-tests`, which only runs `apps/web`) keeps running these tests. A dedicated CI job for `ui` is left for later. App-only test helpers are removed: `calendar.test.tsx` uses `@testing-library/react`, and `button.test.tsx` swaps `next/link` for a local anchor component that tests the same `render` prop behaviour.

**D7. Jest mocks are pointed at the real module.** 53 app and views test files (75 call sites) call `jest.mock('@safe-global/views/components/ui/<x>')` or `jest.mock('@safe-global/views/hooks/use-mobile')`. Today, component files inside `ui` import their siblings through that same absolute path (for example `sidebar.tsx` imports tooltip and `use-mobile`), so those mocks also reach inside them. After D4, the internal imports are relative, and a mock of the re-export file wouldn't reach them anymore. Rewriting the mock _target_ to `@safe-global/ui/<x>` fixes this. That path resolves to the real file, which is what jest keys mocks on, so the mock reaches the re-export file and the relative imports alike, the same as today. Only `jest.mock` / `jest.requireActual` / `jest.unmock` / `jest.doMock` string arguments change. Imports stay on the `views` paths until the Phase 2 codemod.

**D8. Cutting the couplings.**

- _Input_: `packages/ui/src/components/input.tsx` drops `@safe-global/utils`, `stripChainPrefix`, the `address` prop and the paste override. `onPaste` passes straight through, and the script-injection guard stays. The paste behaviour becomes `AddressPasteInput` in `packages/views/src/components/common/AddressPasteInput/index.tsx`. It wraps `Input` and, on paste, runs `cleanInputValue` + `parsePrefixedAddress`, sets the value through the native setter, dispatches `input`, then calls the caller's `onPaste`. Its only user, `MemberInviteRow.tsx`, switches to it and drops the `address` prop.
- _Sonner_: `Toaster` drops `useTheme` and takes `theme` as a prop that defaults to `'system'`. That's what it rendered before, since no app or Storybook provides `next-themes` around it, and nothing outside its story uses `Toaster`. No wrapper is needed.
- _Absolute imports_: rewritten as relative imports by a scripted edit (task T3).
- _`ICON_STROKE`_: moves into `src/lib/utils.ts`, and `views/components/common/iconStroke.ts` re-exports it.
- _Tokens CSS_: untouched (Phase 1). `apps/web/src/styles/shadcn.css` already has `@source '../../../../packages'`, which covers `packages/ui`.

**D9. ESLint rules module moves now, with a re-export left behind.** `packages/ui` lint has to apply the same design-system rules that `views` lint applies to these files today. The package can't import from `views`, because that would point the dependency backwards. So `eslint-design-system.mjs` moves to `packages/ui/eslint/design-system.mjs`, and `packages/views/eslint-design-system.mjs` becomes a one-line re-export. The `apps/web` import doesn't change. Publishing it as `./eslint` is Phase 2.

**D10. Commits keep history.** The engineer commits the pure `git mv` on its own first, so `git log --follow` works on the moved files. That commit doesn't compile, and the final head must. Suggested sequence: `refactor(ui): move shadcn primitives to packages/ui` → `refactor(ui): cut couplings and re-export ui from views` → `tests: point ui module mocks at @safe-global/ui` → `chore: wire packages/ui into jest, storybook, turbo and CI` → `docs: add packages/ui guidance`.

## Target layout

```
packages/ui/
  package.json  tsconfig.json  tsconfig.jest.json  jest.config.cjs  jest.setup.ts  eslint.config.mjs
  AGENTS.md  CLAUDE.md  README.md
  docs/figma-code-connect.md
  eslint/design-system.mjs
  types/assets.d.ts                       # *.module.css declaration
  src/components/<52 components>.tsx|ts  table.module.css  <19 tests>
  src/components/stories/<52 stories>.stories.tsx  drawer.stories.test.tsx
  src/hooks/use-mobile.ts  use-tablet.ts
  src/lib/utils.ts                        # cn + ICON_STROKE
  src/provider.tsx                        # ex ShadcnProvider.tsx
  src/package-exports.test.ts
packages/views/src/components/ui/<52 files>.tsx|ts   # `export * from '@safe-global/ui/<name>'`
packages/views/src/components/ui/ShadcnProvider.tsx   # `export * from '@safe-global/ui/provider'`
packages/views/src/components/ui/stories/design-system.stories.tsx  # unchanged
```

The 52 components are accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, checkbox, chip, collapsible, combobox, context-menu, dialog, drawer, dropdown-menu, empty, field, hover-card, input-group, input-otp, input, kbd, label, link, list, navigation-menu, overlay (`.ts`), pagination, popover, progress, radio-group, resizable, scroll-area, search-input, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, tooltip and typography.

## Tasks

Prefix every yarn command with `export COREPACK_NPM_REGISTRY=https://registry.npmjs.org &&`.

### T0. Capture the visual baseline (before any edit)

On the base commit:

```bash
yarn workspace @safe-global/web build-storybook --output-dir storybook-static
jq -r '.entries | keys[]' apps/web/storybook-static/index.json | sort > $SCRATCH/story-ids.before
npx -y http-server apps/web/storybook-static -p 6006 -s &   # any static server
yarn workspace @safe-global/web storybook:sweep -- --filter=ui-,design-system --shots=$SCRATCH/shots-before --manifest=$SCRATCH/manifest.before.json
yarn workspace @safe-global/web-tanstack build && cat apps/web-tanstack/dist/assets/*.css > $SCRATCH/tanstack.before.css
```

Keep these outside the repo (`$SCRATCH` = the session scratchpad).

### T1. Scaffold `packages/ui` and the dependencies

Create:

- `packages/ui/package.json`: `name @safe-global/ui`, `version 0.0.0`, `private: true`, `type: module`, `sideEffects: ["*.css"]`, `exports` per D2.
  - `scripts`: `lint: eslint src`, `type-check: yarn run -T -B tsc --noEmit`, `test: jest`, `prettier` / `prettier:fix` (same as views).
  - `dependencies`, with the same ranges as `views`: `@base-ui/react ^1.1.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `input-otp ^1.4.2`, `lucide-react ^0.563.0`, `react-day-picker ^9.13.0`, `react-resizable-panels ^4.5.3`, `sonner ^2.0.7`, `tailwind-merge ^3.4.0`, `vaul ^1.1.2`.
  - `peerDependencies`: `react ^19.2.0`, `react-dom ^19.2.0`.
  - `devDependencies`, with the same ranges as elsewhere in the repo (constraints check `react`, `jest`, `@types/*`, `typescript`, `eslint`, `jest-fixed-jsdom`): `@eslint/js ^9.18.0`, `@safe-global/test workspace:^`, `@shadcn/lint ^0.2.4`, `@storybook/react ^10.6.5`, `@testing-library/dom ^10.4.2`, `@testing-library/jest-dom ^6.6.3`, `@testing-library/react ^16.3.3`, `@testing-library/user-event ^14.6.8`, `@types/jest ^30.0.0`, `@types/react ~19.2.10`, `@types/react-dom ~19.2.0`, `eslint ^9.39.4`, `eslint-plugin-react-hooks ^5.2.0`, `jest ^30.5.2`, `jest-fixed-jsdom ^0.0.11`, `react 19.2.0`, `react-dom 19.2.0`, `ts-jest ^29.4.6`, `typescript ~5.9.2`, `typescript-eslint ^8.72.1`.
- `packages/ui/tsconfig.json`: extends `../../config/tsconfig/confs/base.json`.
  - `compilerOptions`: `noEmit: true`, `jsx: react-jsx`, `types: ["node","jest","@testing-library/jest-dom"]`, `paths: {}`.
  - `include`: `src/**/*.ts`, `src/**/*.tsx`, `types/*.d.ts`.
  - `exclude`: `src/**/*.stories.test.tsx`.
- `packages/ui/tsconfig.jest.json`: a copy of `apps/web-tanstack/tsconfig.jest.json` (`module: CommonJS`, `jsx: react-jsx`, the same `types`).
- `packages/ui/jest.config.cjs`: spreads `../../config/test/presets/jest-preset`, then sets:
  - `testEnvironment: 'jest-fixed-jsdom'` and `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`
  - `transform: {'^.+\\.(t|j)sx?$': ['ts-jest', {tsconfig: '<rootDir>/tsconfig.jest.json', isolatedModules: true}]}`
  - `testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)']`
  - `testPathIgnorePatterns: [...preset.testPathIgnorePatterns, '\\.stories\\.test\\.tsx$']`
- `packages/ui/jest.setup.ts`: `import '@testing-library/jest-dom'`, `process.env.TZ = 'UTC'`, and the PointerEvent, pointer-capture, `scrollIntoView`, `matchMedia` and `ResizeObserver` polyfills copied from `apps/web/jest.setup.js`.
- `packages/ui/eslint.config.mjs`: the `views` config with `designSystemSyntaxRules` imported from `./eslint/design-system.mjs`.
  - It applies `react-hooks`, `shadcn/no-raw-colors` and `no-restricted-syntax` to production files.
  - `no-restricted-imports` applies to all files except `*.stories.test.tsx`, with paths `next`, `next-themes` and patterns `next/*`, `@safe-global/*`, `@/*`. The message is "packages/ui is framework- and domain-agnostic: no Next, no workspace packages, no app aliases."
  - Stories get only the import ban, not the syntax rules.
- `packages/ui/types/assets.d.ts`: the `*.module.css` declaration only, from `packages/views/types/assets.d.ts`.
- `packages/ui/src/package-exports.test.ts`: reads `package.json` and `src/components`. It asserts that every non-test `*.ts(x)` in `src/components` has a `./<basename>` key pointing at it, and that every export target exists.

Edit:

- `packages/views/package.json`, `apps/web/package.json`, `apps/web-tanstack/package.json`: add `"@safe-global/ui": "workspace:^"` to `dependencies`. Nothing else changes in `views`. Dependency pruning is Phase 2.

Then run `yarn install` and confirm that `node_modules/@safe-global/ui` (or `packages/views/node_modules/@safe-global/ui`) is a symlink to `packages/ui`.

### T2. Move the files (pure `git mv`, no content edits)

```bash
V=packages/views/src/components/ui; U=packages/ui/src/components
mkdir -p $U/stories packages/ui/src/hooks packages/ui/src/lib packages/ui/docs packages/ui/eslint
for f in $V/*.ts $V/*.tsx $V/table.module.css; do [ "$(basename $f)" = ShadcnProvider.tsx ] || git mv "$f" $U/; done
for f in $V/stories/*; do [ "$(basename $f)" = design-system.stories.tsx ] || git mv "$f" $U/stories/; done
git mv $V/ShadcnProvider.tsx packages/ui/src/provider.tsx
git mv $V/docs/figma-code-connect.md packages/ui/docs/figma-code-connect.md
git mv $V/README.md packages/ui/README.md
git mv packages/views/src/utils/cn.ts packages/ui/src/lib/utils.ts
git mv packages/views/src/hooks/use-mobile.ts packages/views/src/hooks/use-tablet.ts packages/ui/src/hooks/
git mv packages/views/eslint-design-system.mjs packages/ui/eslint/design-system.mjs
```

Commit T1 and T2 together as the move commit (D10).

### T3. Rewrite imports inside `packages/ui` (scripted)

```bash
cd packages/ui/src
sed -i -E \
  -e "s#'@safe-global/views/components/ui/ShadcnProvider'#'../provider'#" \
  -e "s#'@safe-global/views/components/ui/([a-z-]+)'#'./\1'#" \
  -e "s#'@safe-global/views/(utils/cn|components/common/iconStroke)'#'../lib/utils'#" \
  -e "s#'@safe-global/views/hooks/(use-[a-z]+)'#'../hooks/\1'#" components/*.ts components/*.tsx
sed -i -E \
  -e "s#'@safe-global/views/components/ui/ShadcnProvider'#'../../provider'#" \
  -e "s#'@safe-global/views/components/ui/([a-z-]+)'#'../\1'#" \
  -e "s#'@safe-global/views/utils/cn'#'../../lib/utils'#" components/stories/*.tsx
sed -i "s#'@safe-global/views/utils/cn'#'./lib/utils'#" provider.tsx
```

Append `ICON_STROKE` (with its one-line comment) from `packages/views/src/components/common/iconStroke.ts` to `src/lib/utils.ts`. Fix the README import examples later (T8). Check with `grep -rn "@safe-global/views" packages/ui`, which must print nothing.

### T4. Cut the couplings (after T3)

- `packages/ui/src/components/input.tsx`: apply D8 (remove the `@safe-global/utils` import, `stripChainPrefix`, the `address` prop and `handlePaste`, and leave `onPaste` in `...props`).
- `packages/ui/src/components/sonner.tsx`: remove `next-themes`. The signature becomes `({ theme = 'system', ...props }: ToasterProps)` and it passes `theme={theme}`.
- `packages/ui/src/components/button.test.tsx`: replace `next/link` with `const AppLink = (props: React.ComponentProps<'a'> & { href: string }) => <a {...props} />`, and keep both cases.
- `packages/ui/src/components/calendar.test.tsx`: import `render`, `screen` from `@testing-library/react`.
- New `packages/ui/src/components/sonner.test.tsx`: `Toaster` renders without a theme provider and forwards `theme` (for example, it renders `<Toaster theme="dark" />` and asserts the `section`/`ol` carries `data-sonner-theme="dark"` after a `toast()` call).
- `packages/ui/src/components/input.render.test.tsx`: add a case showing that `onPaste` is forwarded and pasted text isn't rewritten.
- New `packages/views/src/components/common/AddressPasteInput/index.tsx`: per D8. It takes `React.ComponentProps<typeof Input>`, and `Input` is imported from `@safe-global/views/components/ui/input` (the views convention until Phase 2).
- New `packages/views/src/components/common/AddressPasteInput/index.test.tsx`: pasting `eth:0x…` leaves `0x…` in the field, fires `onChange` and calls the caller's `onPaste`.
- `apps/web/src/features/spaces/components/InviteMembersOnboarding/components/MemberInviteRow.tsx`: import `AddressPasteInput` from `@safe-global/views/components/common/AddressPasteInput`, render it in place of `<Input address …>`, and drop the `address` prop.

### T5. Re-export files in `views`

- `packages/views/src/components/ui/<name>.tsx|ts`, recreated for each of the 52 moved component files: `export * from '@safe-global/ui/<name>'`.
  ```bash
  for f in packages/ui/src/components/*.ts packages/ui/src/components/*.tsx; do b=$(basename "$f"); case "$b" in *.test.*) continue;; esac; printf "export * from '@safe-global/ui/%s'\n" "${b%.*}" > "packages/views/src/components/ui/$b"; done
  ```
- `packages/views/src/components/ui/ShadcnProvider.tsx`: `export * from '@safe-global/ui/provider'`.
- `packages/views/src/utils/cn.ts`: `export { cn } from '@safe-global/ui/utils'`.
- `packages/views/src/hooks/use-mobile.ts`, `use-tablet.ts`: `export * from '@safe-global/ui/hooks/use-mobile'` (and `use-tablet`).
- `packages/views/src/components/common/iconStroke.ts`: `export { ICON_STROKE } from '@safe-global/ui/utils'`.
- `packages/views/eslint-design-system.mjs`: `export * from '../ui/eslint/design-system.mjs'`.

### T6. Point jest mocks at `@safe-global/ui` (D7)

```bash
grep -rlE "jest\.(mock|requireActual|unmock|doMock)\(['\"]@safe-global/views/(components/ui/|hooks/use-(mobile|tablet))" apps/web/src packages/views/src \
 | xargs sed -i -E \
  -e "s#(jest\.(mock|requireActual|unmock|doMock)\(['\"])@safe-global/views/components/ui/ShadcnProvider#\1@safe-global/ui/provider#g" \
  -e "s#(jest\.(mock|requireActual|unmock|doMock)\(['\"])@safe-global/views/components/ui/#\1@safe-global/ui/#g" \
  -e "s#(jest\.(mock|requireActual|unmock|doMock)\(['\"])@safe-global/views/hooks/use-#\1@safe-global/ui/hooks/use-#g"
```

Expected: 75 call sites in 53 test files under `apps/web/src` and `packages/views/src`. Afterwards, `grep -rnE "jest\.(mock|requireActual|unmock|doMock)\(['\"]@safe-global/views/(components/ui/|hooks/use-)" apps packages` must print nothing.

### T7. Wire up the consumers

- `apps/web/jest.config.cjs`: `roots: ['<rootDir>', '<rootDir>/../../packages/views/src', '<rootDir>/../../packages/ui/src']`.
- `apps/web/tsconfig.json`: add `"../../packages/ui/src/**/*.ts"` and `"../../packages/ui/src/**/*.tsx"` to `include`. This type-checks the ui tests and stories in CI, including `drawer.stories.test.tsx`.
- `apps/web/next.config.mjs`: `transpilePackages: ['@safe-global/store', '@safe-global/theme', '@safe-global/ui']`.
- `apps/web/.storybook/main.ts` and `apps/web/.storybook-vite/main.ts`: add `'../../../packages/ui/src/**/*.mdx'` and `'../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'` to `stories`.
- `apps/web/.storybook/shadcn-stories.css`: keep the views line (design-system stories) and add `@source '../../../packages/ui/src/components/stories';`.
- `apps/web/scripts/generate-storybook-tests.cjs`: add `...globSync(path.join(__dirname, '../../../packages/ui/src/**/*.stories.tsx'))`.
- `turbo.json`: add `"$TURBO_ROOT$/packages/ui/eslint/**"` to `tasks.lint.inputs`, because the `views` and `web` lint results depend on it.
- `.github/workflows/web-storybook-tests.yml`: add `packages/ui/**` to both `paths` lists.
- `.github/workflows/web-checks.yml`: the step "Run ESLint (packages/views)" becomes "Run ESLint (packages/views, packages/ui)" with `yarn turbo run lint --filter=@safe-global/views --filter=@safe-global/ui`.
- `apps/web/.storybook/shadcn.ts`: no change (it still imports the views re-export).

### T8. Docs and agent guidance

These edits change agent guidance (`AGENTS.md`, `.claude/skills`), so the PR has to call them out.

- New `packages/ui/AGENTS.md`, which covers:
  - what belongs here (generic, domain-free primitives) and what is banned (`next/*`, `next-themes`, `@safe-global/*`, app aliases, business logic)
  - relative imports only, and every new component gets an `exports` key (the test enforces it)
  - tests are colocated and stories go in `src/components/stories` with an explicit `title`
  - the checks (`yarn workspace @safe-global/ui type-check|lint|test`, plus the `apps/web` Storybook)
  - until Phase 2, `shadcn add` from `apps/web` writes into `views`, so move the file here, make its imports relative, add the export key and a re-export file in `views`
- New `packages/ui/CLAUDE.md`: `Read @AGENTS.md for ui package guidelines.`
- `packages/ui/README.md`: rewrite the moved README as a short package README covering what it is, the import style (`@safe-global/ui/button`), that it's private and consumed from source until Phase 4, the semi-generated shadcn note, and a stories location of `src/components/stories`.
- `AGENTS.md` (root): add a `packages/ui/` row to the nested-guidance table and reword the `packages/views/` row (primitives now live in `packages/ui`).
- `packages/AGENTS.md`: change the intro sentence to "`views` and `ui` are web only and have their own guides".
- `packages/views/AGENTS.md`:
  - `src/components/ui/` now holds temporary re-exports of `@safe-global/ui`. Don't add or edit primitives there; they're removed in Phase 2.
  - Point the shadcn README link at `packages/ui/README.md`.
  - The "Checks" section mentions `packages/ui`.
- `apps/web/AGENTS.md`: update the file links on lines 14 (overlay), 27 (`button.tsx`) and 109 (README) to their `packages/ui` paths. The import guidance (`@safe-global/views/components/ui/*`) stays until Phase 2.
- `.claude/skills/design.sync-component/SKILL.md`, `design.figma-to-code/SKILL.md`, `design.prototype/SKILL.md`, `design.verify/SKILL.md`: change component file paths to `packages/ui/src/components/` and the Code Connect doc to `packages/ui/docs/figma-code-connect.md`. Import examples stay on `views` until Phase 2.
- `.codescene.yml`: replace the stale `apps/web/src/components/ui/**` patterns with `packages/ui/src/components/**` and `packages/ui/src/components/stories/**`.

### T9. Verify (see below), then T10: visual comparison against T0.

## Parallelization

| Group | Tasks (run together)                     | Files touched                                                                                                                                                                            |
| ----- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G0    | T0                                       | none (scratch outputs only); must run on the base commit before anything else                                                                                                            |
| G1    | T1 ‖ T2 (one agent, then `yarn install`) | T1: `packages/ui/*` root files, `packages/ui/types`, `packages/ui/src/package-exports.test.ts`, 3× `package.json`, `yarn.lock`. T2: the `git mv` set.                                    |
| G2    | **A:** T3 → T4 (one agent, sequential)   | `packages/ui/src/**`, `packages/views/src/components/common/AddressPasteInput/**`, `MemberInviteRow.tsx`                                                                                 |
|       | **B:** T5                                | `packages/views/src/components/ui/*.ts(x)` re-export files, `packages/views/src/{utils/cn.ts,hooks/use-*.ts,components/common/iconStroke.ts}`, `packages/views/eslint-design-system.mjs` |
|       | **C:** T6                                | `apps/web/src/**/*.test.tsx`, `packages/views/src/**/*.test.tsx` (mock strings only)                                                                                                     |
|       | **D:** T7                                | `apps/web/{jest.config.cjs,tsconfig.json,next.config.mjs}`, `apps/web/.storybook*/main.ts`, `shadcn-stories.css`, `generate-storybook-tests.cjs`, `turbo.json`, 2 workflows              |
|       | **E:** T8                                | `AGENTS.md`, `packages/AGENTS.md`, `packages/views/AGENTS.md`, `apps/web/AGENTS.md`, `packages/ui/{AGENTS,CLAUDE,README}.md`, `.claude/skills/design.*`, `.codescene.yml`                |
| G3    | T9 → T10 (sequential, after all of G2)   | none                                                                                                                                                                                     |

Ordering rules:

- T2 must finish before G2, because every G2 task depends on the moved files existing.
- T3 must come before T4, because both edit `input.tsx`, `sonner.tsx`, `search-input.tsx` and the tests.
- The G2 streams A–E touch disjoint files.
- `yarn install` must run after T1 and before T9.
- Only verification started after the last edit counts.

## Verification commands

From the repo root, with the corepack prefix:

```bash
# workspace graph, constraints, symlink
yarn install && yarn constraints
ls -l node_modules/@safe-global/ui packages/views/node_modules/@safe-global/ui 2>/dev/null

# packages
yarn workspace @safe-global/ui type-check
yarn workspace @safe-global/ui lint
yarn workspace @safe-global/ui test
yarn workspace @safe-global/views type-check
yarn workspace @safe-global/views lint
yarn turbo run type-check lint test --filter=@safe-global/ui --filter=@safe-global/views --force

# web (type-check covers the ui/views tests and stories; the full jest run covers the T6 mock rewrite)
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web lint
yarn workspace @safe-global/web test --watchAll=false
yarn workspace @safe-global/web test:storybook --watchAll=false
yarn workspace @safe-global/web build-storybook --output-dir storybook-static
yarn workspace @safe-global/web build-storybook:vite
node scripts/verify.mjs --changed --workspace=web

# web-tanstack (the Vite proof for R5)
yarn workspace @safe-global/web-tanstack type-check
yarn workspace @safe-global/web-tanstack lint
yarn workspace @safe-global/web-tanstack test --watchAll=false
yarn workspace @safe-global/web-tanstack build
node scripts/verify.mjs --changed --workspace=web-tanstack

# repo-level
yarn knip:exports:web
yarn prettier
# optional, long: full static export of the wallet
yarn workspace @safe-global/web build
```

## Acceptance checks

1. `packages/ui` exists as `@safe-global/ui`, and `yarn workspaces list` shows it.
2. Its type-check, lint and test pass, and `package-exports.test.ts` passes.
3. No framework or domain imports remain in ui. This command prints nothing:
   `grep -rnE "from '(next(/[^']*)?|next-themes|@safe-global/[^']*|@/[^']*)'" packages/ui/src --include=*.ts --include=*.tsx | grep -v '\.stories\.test\.tsx'`
4. `grep -rn "@safe-global/views" packages/ui` prints nothing.
5. Every re-export file is one line. Both of these print nothing:
   - `grep -L "^export \* from '@safe-global/ui/" packages/views/src/components/ui/*.ts packages/views/src/components/ui/*.tsx`
   - `ls packages/views/src/components/ui` shows only the re-export files plus `stories/design-system.stories.tsx`.
6. `Input` has no `address` prop, and `@safe-global/utils` appears in no file under `packages/ui`. `MemberInviteRow` uses `AddressPasteInput`, and its paste test passes.
7. `Toaster` takes `theme` (default `'system'`), and `next-themes` appears in no file under `packages/ui`.
8. The `web` and `web-tanstack` type-check, lint, test and build commands above all pass, as do both Storybook builds.
9. Story IDs are unchanged. `jq -r '.entries | keys[]' apps/web/storybook-static/index.json | sort | diff - $SCRATCH/story-ids.before` is empty.
10. Pixels are unchanged. Rerun the T0 sweep into `$SCRATCH/manifest.after.json` (same filter). `diff <(jq -S . $SCRATCH/manifest.before.json) <(jq -S . $SCRATCH/manifest.after.json)` is empty. If it isn't, rerun once: the sweep guide notes rare anti-aliasing noise.
11. No CSS rule is lost in web-tanstack. Every selector in `tanstack.before.css` is still in the new build's CSS. Additions are acceptable, because Tailwind also scans the new `.md` files.
12. No jest mock still targets a moved `views` path (the T6 grep is empty).
13. Mobile is untouched: `git diff --stat <base>.. -- apps/mobile` is empty, and `apps/mobile/package.json` names neither `@safe-global/views` nor `@safe-global/ui`.

## Requirement traceability

| Req      | Phase 0 status                                                                                                                                             | Rest goes to                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| R1       | **Partial**: per-component keys, `./utils`, `./hooks/*`, `./provider`, no root barrel                                                                      | `./styles.css` `./tokens.css` (+`scoped.css`) → P1; `./eslint` → P2               |
| R2       | **Partial**: dependency/peer split (React peers; Base UI, cva, clsx, tailwind-merge, lucide and others as deps); exports shape ready to retarget at `dist` | Tailwind peer → P1; tsup/tsdown, `.d.ts`, `'use client'` banners → P4             |
| R3       | Deferred                                                                                                                                                   | P1                                                                                |
| R4       | Deferred                                                                                                                                                   | P1                                                                                |
| R5       | **Addressed for code**: no `next/*` or `next-themes`, enforced by lint and `paths: {}`; web-tanstack (Vite) builds against it                              | P3/P4 prove it in a non-wallet app                                                |
| R6       | **Partial**: tests and stories moved and run                                                                                                               | Docs reuse stories → P3                                                           |
| R7       | Deferred (`private: true` in this phase)                                                                                                                   | P4 (outside this effort)                                                          |
| R8–R12   | Deferred                                                                                                                                                   | P3                                                                                |
| R13      | Deferred                                                                                                                                                   | P3 (static export), P4 (hosting)                                                  |
| R14      | Deferred: needs the design team's GitHub handle; `/packages/` is already owned by web+mobile                                                               | P2                                                                                |
| R15      | **Partial**: Code Connect doc moved with the components; skill paths updated                                                                               | Extend → P3                                                                       |
| R16      | **Partial**: "no domain logic" enforced by lint and tsconfig                                                                                               | shadcn-add-in-package (`packages/ui/components.json`) → P2; major changesets → P4 |
| R17      | **Partial**: stories live in `packages/ui` and keep rendering (and being visually tested) in the `apps/web` Storybook                                      | Own Storybook → P1; required design-approved visual check → P2                    |
| SC1      | Not in this phase                                                                                                                                          | P3 docs + P4 publish                                                              |
| SC2      | Groundwork: no visual change, re-exports in place                                                                                                          | P2                                                                                |
| SC3, SC4 | Not in this phase                                                                                                                                          | P3 (SC4 public URL → P4)                                                          |
| SC5      | Not in this phase                                                                                                                                          | P1                                                                                |

## Risks

1. **Mocks stop reaching inside components.** Covered by T6 (D7), and the full `web` jest run is the gate. If a test still fails, it was relying on the re-export path. Point that test's mock at `@safe-global/ui/<x>`; don't edit the component.
2. **Story-only utilities missing.** If the `shadcn-stories.css` `@source` is wrong, classes used only in stories disappear. Acceptance check 10 (filtered to `ui-` stories) catches it.
3. **Two copies of a module.** The base tsconfig has `preserveSymlinks: true` (for `views` and `ui`), while bundlers and jest resolve real paths. In the bundles, everything goes through the real path, so there's a single copy. `ShadcnProvider` also keeps its context on `globalThis`. Watch for "two different types with this name" errors in TS. The fix there is to import through the same specifier, not to add aliases.
4. **Next server pass.** If Next externalises the `.tsx` files during the server pass, the static export fails. `transpilePackages` plus the `./package.json` export prevents this. The optional `yarn workspace @safe-global/web build` proves it.
5. **Stale turbo cache across packages.** Turbo doesn't hash `packages/ui` for `views`/`web` tasks. Verification uses `--force`, and lint inputs get `$TURBO_ROOT$/packages/ui/eslint/**`.
6. **Move commit doesn't compile.** That's intended (D10). If someone bisects through it, skip it, or squash on merge.
7. **shadcn CLI.** `apps/web/components.json` still points at `views` until Phase 2. Running `shadcn add` in this window puts files in `views`, so `packages/ui/AGENTS.md` documents the manual move.
8. **CSS module in a future published package.** `table.module.css` works in-repo. Phase 4's build must handle it or convert it.
9. **Tests run twice.** The ui tests run in both `ui` jest and `web` jest until `ui` has its own CI job. They're cheap and keep the coverage thresholds unchanged.

## Implementation notes

Deviations from the plan, all small:

1. **Extra dev dependencies.** `packages/ui` also lists `jest-environment-jsdom ^30.5.2` and `storybook ^10.6.5`. They are required peers of `jest-fixed-jsdom` and `@storybook/react`, and `yarn install` warned (YN0002) without them. Both ranges match the other workspaces, so `yarn constraints` stays green.
2. **Story lint.** Stories get the import ban only, as planned. Their existing `eslint-disable-next-line no-restricted-syntax` comments would then be reported as unused, so the stories block sets `reportUnusedDisableDirectives: 'off'`.
3. **`search-input.tsx`** imported `ICON_STROKE` and `cn` from two paths that both became `../lib/utils`. They are merged into one import.
4. **`AddressPasteInput`** has a default export only, like the other `views/components/common/*` components. `MemberInviteRow` imports it as a default.
5. **Code Connect doc.** Moving `figma-code-connect.md` from `components/ui/docs/` to `packages/ui/docs/` broke its `../<name>.tsx` links, so they now point at `../src/components/<name>.tsx`. The stale "Code Location" line now says `packages/ui/src/components/`. Links to components that never existed (carousel, command, …) are unchanged.
6. **`storybook-local-images.test.ts`** in `apps/web` scanned `packages/views/src` for story data. It now also scans `packages/ui/src`, so the moved stories stay covered.
7. **Acceptance checks 4, 6 and 7** are literal greps over all of `packages/ui`. The package docs are worded so that check 4 prints nothing. `next-themes` still appears in `eslint.config.mjs` and `AGENTS.md`, because that is where it is banned. No source file under `packages/ui/src` imports it, and check 3 is clean.
8. **Environment.** `build-storybook` ran out of memory at Node's default heap of about 2 GB in this container, both on the base commit and after the change. Every Storybook build here ran with `NODE_OPTIONS=--max-old-space-size=8192`. No repo change was needed.
9. **Visual comparison.** The T0 sweep filtered on `ui-,design-system` snapshots only 56 of the 208 story×mode cells, because most `UI/*` stories are tagged `skip-visual-test`. A second sweep ran with that tag ignored, using a temporary copy of `scripts/storybook` with `SKIP_SNAPSHOT_TAG` changed. That copy was deleted after each run and never committed. The sweep covered all 208 cells (63 sheets) before and after. Two runs on the base commit gave identical hashes, so the comparison is deterministic.
10. **`build-storybook:vite` fails on the base commit too.** It stops with `UNLOADABLE_DEPENDENCY` on `@safe-global/views/assets/images/transactions/signature.svg`, imported by `packages/views/src/components/tx-flow/common/TxSectionTitle/TxSectionTitle.stories.tsx`. The same error occurs at `03af007`, so it is unrelated to this phase and was left alone. It also writes into `apps/web/storybook-static` by default, so run the webpack build after it, or give it its own `--output-dir`.
11. **`node scripts/verify.mjs --changed`** first reported nothing to verify. The clone was shallow and had not fetched `dev`, so `git merge-base HEAD origin/dev` failed, and the script fell back to an empty file list. After `git fetch --deepen=300 origin dev` the merge base resolves and the scoped run works. The full type-check, lint, test and build commands were also run explicitly.
12. **Review fixes.**
    - A relative path could climb out of the package past the import ban. Two guards now stop that: `src/relative-imports.test.ts` fails on any relative import that resolves outside `src/`, and lint rejects any relative import that climbs three or more levels (`^(\.\./){3,}`).
    - The turbo `type-check` and `test` inputs now include `$TURBO_ROOT$/packages/ui/src/**` and `$TURBO_ROOT$/packages/views/src/**`, so a change there invalidates the `web` and `views` hashes. Before this, those hashes ignored package changes.
    - The `web-checks` type-check step now also runs `@safe-global/ui`.
    - The unused `@safe-global/test` devDependency is dropped, because `jest.config.cjs` loads the preset by relative path.

## Follow-ups

- Phase 2: prune the `next-themes` dependency from `apps/web`, `apps/web-tanstack` and `packages/views`. `Toaster` no longer reads it, and none of their source imports it.
- `build-storybook:vite` fails on the base commit too (`UNLOADABLE_DEPENDENCY` on the `signature.svg` import in `packages/views/src/components/tx-flow/common/TxSectionTitle/TxSectionTitle.stories.tsx`). That bug belongs to a separate fix.
