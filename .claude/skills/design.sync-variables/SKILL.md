---
name: design.sync-variables
description: Sync CSS variables from Figma plugin export to globals.css. Use when updating design tokens/colors from Figma.
disable-model-invocation: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
---

# Sync Variables from Figma

Sync CSS variables from Figma plugin [variables2css](https://www.figma.com/community/plugin/1261234393153346915) export to `globals.css`.

## Rules

1. **Only update existing variables** - Never add new variables
2. **Keep code order** - Only change values, not structure
3. **Direct mappings only** - Only update if Figma has a matching variable
4. **Use Figma plugin export** - Do NOT use Figma MCP for variables (incomplete data)

## Source Files

- **Source of truth**: Figma plugin export (user provides)
- **Target**: `apps/web/src/styles/globals.css`

## Process

1. Ask user for Figma CSS Variables plugin export
2. Compare Figma values vs `globals.css` existing variables
3. Update only values that differ (use direct hex values)
4. Verify: `yarn workspace @safe-global/web type-check`

## Variable Mapping

| Figma Export                           | CSS Variable                   |
| -------------------------------------- | ------------------------------ |
| `--general-background`                 | `--background`                 |
| `--general-foreground`                 | `--foreground`                 |
| `--general-primary`                    | `--primary`                    |
| `--general-primary-foreground`         | `--primary-foreground`         |
| `--general-secondary`                  | `--secondary`                  |
| `--general-secondary-foreground`       | `--secondary-foreground`       |
| `--general-muted`                      | `--muted`                      |
| `--general-muted-foreground`           | `--muted-foreground`           |
| `--general-accent`                     | `--accent`                     |
| `--general-accent-foreground`          | `--accent-foreground`          |
| `--general-destructive`                | `--destructive`                |
| `--general-border`                     | `--border`                     |
| `--general-input`                      | `--input`                      |
| `--card-card`                          | `--card`                       |
| `--card-card-foreground`               | `--card-foreground`            |
| `--popover-popover`                    | `--popover`                    |
| `--popover-popover-foreground`         | `--popover-foreground`         |
| `--focus-ring`                         | `--ring`                       |
| `--sidebar-sidebar`                    | `--sidebar`                    |
| `--sidebar-sidebar-foreground`         | `--sidebar-foreground`         |
| `--sidebar-sidebar-primary`            | `--sidebar-primary`            |
| `--sidebar-sidebar-primary-foreground` | `--sidebar-primary-foreground` |
| `--sidebar-sidebar-accent`             | `--sidebar-accent`             |
| `--sidebar-sidebar-accent-foreground`  | `--sidebar-accent-foreground`  |
| `--sidebar-sidebar-border`             | `--sidebar-border`             |
| `--sidebar-sidebar-ring`               | `--sidebar-ring`               |

## Example

User provides export:

```css
--general-background: #ffffff;
--general-primary: #12ff80;
```

Update in globals.css:

```css
--background: #ffffff;
--primary: #12ff80;
```
