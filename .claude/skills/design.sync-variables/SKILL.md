---
name: design.sync-variables
description: Sync shadcn token values from a Figma plugin export into packages/theme/src/tokens/ui.ts and regenerate the Safe UI token CSS. Use when updating design tokens/colors from Figma.
disable-model-invocation: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
---

# Sync Variables from Figma

Sync CSS variables from Figma plugin [variables2css](https://www.figma.com/community/plugin/1261234393153346915) export into the Safe UI token source.

## Rules

1. **Only update existing variables** - Never add new variables
2. **Keep code order** - Only change values, not structure
3. **Direct mappings only** - Only update if Figma has a matching variable
4. **Use Figma plugin export** - Do NOT use Figma MCP for variables (incomplete data)
5. **Never edit the generated CSS** - `packages/ui/src/styles/tokens.css` and `tokens.scoped.css` are written by the generator

## Source Files

- **Source of truth**: Figma plugin export (user provides)
- **Target**: `packages/theme/src/tokens/ui.ts` (`uiTokens.light` / `uiTokens.dark`). Values read from the palette there (dark `destructive`, `accent-success`) change in `packages/theme/src/palettes` or the web overrides in `src/generators/css-vars.ts`, which also changes `vars.css`

## Process

1. Ask user for Figma CSS Variables plugin export
2. Compare Figma values vs the existing keys in `ui.ts`
3. Update only values that differ (use lowercase hex values)
4. Regenerate: `yarn workspace @safe-global/theme generate:ui-tokens` (and `yarn workspace @safe-global/web css-vars` if a palette changed)
5. Verify: `yarn workspace @safe-global/theme test` and `yarn workspace @safe-global/web test --watchAll=false src/styles` (the drift test `generatedCss.test.ts` fails if a generated file is stale)

## Variable Mapping

| Figma Export                           | CSS Variable (`ui.ts` key without `--`) |
| -------------------------------------- | --------------------------------------- |
| `--general-background`                 | `--background`                          |
| `--general-foreground`                 | `--foreground`                          |
| `--general-primary`                    | `--primary`                             |
| `--general-primary-foreground`         | `--primary-foreground`                  |
| `--general-secondary`                  | `--secondary`                           |
| `--general-secondary-foreground`       | `--secondary-foreground`                |
| `--general-muted`                      | `--muted`                               |
| `--general-muted-foreground`           | `--muted-foreground`                    |
| `--general-accent`                     | `--accent`                              |
| `--general-accent-foreground`          | `--accent-foreground`                   |
| `--general-destructive`                | `--destructive`                         |
| `--general-border`                     | `--border`                              |
| `--general-input`                      | `--input`                               |
| `--card-card`                          | `--card`                                |
| `--card-card-foreground`               | `--card-foreground`                     |
| `--popover-popover`                    | `--popover`                             |
| `--popover-popover-foreground`         | `--popover-foreground`                  |
| `--focus-ring`                         | `--ring`                                |
| `--sidebar-sidebar`                    | `--sidebar`                             |
| `--sidebar-sidebar-foreground`         | `--sidebar-foreground`                  |
| `--sidebar-sidebar-primary`            | `--sidebar-primary`                     |
| `--sidebar-sidebar-primary-foreground` | `--sidebar-primary-foreground`          |
| `--sidebar-sidebar-accent`             | `--sidebar-accent`                      |
| `--sidebar-sidebar-accent-foreground`  | `--sidebar-accent-foreground`           |
| `--sidebar-sidebar-border`             | `--sidebar-border`                      |
| `--sidebar-sidebar-ring`               | `--sidebar-ring`                        |

## Example

User provides export:

```css
--general-background: #ffffff;
--general-primary: #12ff80;
```

Update in `packages/theme/src/tokens/ui.ts` (`light` for the light export, `dark` for the dark one):

```ts
background: '#ffffff',
primary: '#12ff80',
```
