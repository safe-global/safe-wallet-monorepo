# migrate-design-system codemod

Rewrites imports that used to resolve inside `apps/web/src` to the
`@safe-global/design-system` package, after the design system moved out of the web app.

Kept in-tree for two reasons: it documents the old → new mapping precisely, and it can be
re-run against any branch that still carries pre-move imports (a long-lived feature branch,
or `apps/web-tanstack` code written before the move).

## What it rewrites

| Before                           | After                                                  |
| -------------------------------- | ------------------------------------------------------ |
| `@/components/ui/<name>`         | `@safe-global/design-system/components/<name>`         |
| `@/components/ui/ShadcnProvider` | `@safe-global/design-system/components/ShadcnProvider` |
| `@/utils/cn`                     | `@safe-global/design-system/utils/cn`                  |
| `@/hooks/use-mobile`             | `@safe-global/design-system/hooks/use-mobile`          |
| `@/hooks/use-tablet`             | `@safe-global/design-system/hooks/use-tablet`          |
| `@/components/common/<preset>`   | `@safe-global/design-system/presets/<preset>`          |

Presets covered by the last row: `SubmitButton`, `ActionBar`, `OnboardingFooter`,
`IconAction`, `ChoiceButton`, `SplitMenuButton`.

`DialogActions` is deliberately **not** rewritten. The design system owns the footer, but
`apps/web/src/components/common/DialogActions` remains as a thin wrapper that supplies the
app's `<CheckWallet>` gate — app code should keep importing the wrapper.

It matches `import`/`export … from '<specifier>'`, bare `import '<specifier>'`, dynamic
`import('<specifier>')` and `jest.mock('<specifier>')`, in `.ts`/`.tsx` files. Both quote
styles are handled.

## Usage

```bash
# Dry run — prints the files that would change and the per-specifier counts
node tools/codemods/migrate-design-system/index.mjs --dry apps/web/src

# Apply
node tools/codemods/migrate-design-system/index.mjs apps/web/src
```

Multiple roots can be passed. Run `yarn prettier:fix` afterwards — the rewrite changes line
lengths, which can change how Prettier wraps an import list.
