---
name: design.sync-component
description: Sync a UI component from Figma to code using the component sync workflow. Use when updating components to match Figma designs.
argument-hint: '[component-name]'
allowed-tools:
  - mcp__figma-remote-mcp__get_design_context
  - mcp__figma-remote-mcp__get_screenshot
  - Read
  - Edit
  - Bash
  - Grep
---

# Sync Component from Figma

Sync the **$ARGUMENTS** component from Figma to code.

## Source Files

- **Figma File**: `trBVcpjZslO63zxiNUI9io` (Obra shadcn-ui safe)
- **Component Mapping**: `apps/web/src/components/ui/docs/figma-code-connect.md`
- **Target**: `apps/web/src/components/ui/<component>.tsx`

## Process

### 1. Find Node ID

Look up the component in `figma-code-connect.md` to get the Figma node ID.

### 2. Fetch Design Context

```
mcp__figma-remote-mcp__get_design_context(
  fileKey: "trBVcpjZslO63zxiNUI9io",
  nodeId: "<node-id>",
  disableCodeConnect: true
)
```

Also get a screenshot for visual reference:

```
mcp__figma-remote-mcp__get_screenshot(fileKey, nodeId)
```

**Check for changelog comments**: Look for comments on the Figma component page that document changes (e.g., "removed shadow and border", "updated spacing", "changed variant names"). These comments indicate intentional design changes that should be synced to code.

### 3. Compare & Document

**First, check Figma comments for changelog** - Look for documented changes in component comments that describe what was modified (e.g., "removed shadow", "updated border radius", "changed color scheme").

Then compare:

| Check    | What to Compare                                                 |
| -------- | --------------------------------------------------------------- |
| Sizes    | Verify px values match (size-6=24px, size-8=32px, size-10=40px) |
| Colors   | Fill colors → bg-_, text-_ classes                              |
| Border   | border-_, rounded-_ classes                                     |
| Shadow   | shadow-\* classes (Figma often has none)                        |
| Variants | CVA variants object keys                                        |

**Prioritize changelog items** - If changelog comments exist, sync those changes first before doing a full comparison.

### 4. Update Code

**Only sync when Figma actually changed.** Don't remove code defaults that improve DX.

Add/update component header comment:

```tsx
/**
 * ComponentName
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/?node-id=XX:XXXX
 *
 * Intentional differences from Figma:
 * - property: reason for difference
 *
 * Changelog (from Figma comments):
 * - YYYY-MM-DD: Description of changes from Figma changelog comment
 * - YYYY-MM-DD: Additional sync changes made
 */
```

**Note**: The changelog should reflect changes documented in Figma component comments. If Figma has a changelog comment, include those changes in the code changelog.

### 5. Verify

Run type-check:

```bash
yarn workspace @safe-global/web type-check
```

## Rules

1. **Check Figma changelog first** - Always look for changelog comments on the Figma component page that document design changes
2. **Document the delta** - Note intentional differences, only sync breaking changes
3. **Preserve code patterns** - Keep CVA structure, only update classes/variants
4. **Keep existing functionality** - Don't remove event handlers, refs, or accessibility
5. **Verify sizes match** - Check actual pixel values, not just naming conventions
6. **Sync changelog items** - If Figma comments document changes (e.g., "removed shadow", "updated border"), ensure those changes are reflected in code
