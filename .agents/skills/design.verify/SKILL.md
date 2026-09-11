---
name: design.verify
description: Verify Figma implementation is pixel-perfect. Use after implementing Figma designs to catch and fix discrepancies.
argument-hint: '[figma-url-or-node-id]'
allowed-tools:
  - mcp__figma-remote-mcp__get_design_context
  - mcp__figma-remote-mcp__get_screenshot
  - Read
  - Edit
  - Bash
  - Grep
---

# Figma-to-Code Verification

Verify the implementation of **$ARGUMENTS** matches Figma specs.

## The 5-Phase Verification Process

### Phase 1: Component Inventory

**Goal:** Create a complete list of all components to verify.

1. Fetch design context from Figma
2. **Check for changelog comments** - Look for documented changes in Figma component comments
3. Extract all unique node IDs and types
4. Create a checklist

```
mcp__figma-remote-mcp__get_design_context(fileKey, nodeId)
```

**Output format:**

```markdown
## Component Checklist

- [ ] Sidebar (node: 1:3236)
  - [ ] Header with workspace switcher
  - [ ] Navigation items
- [ ] Main content area
  - [ ] TotalValueCard (node: 5:1620)
  - [ ] AssetsCard (node: 5:1624)
```

### Phase 2: Visual Comparison

**Goal:** Compare Figma screenshot vs implementation.

```
mcp__figma-remote-mcp__get_screenshot(fileKey, nodeId)
```

**Comparison Checklist:**

- [ ] Overall layout matches
- [ ] Spacing between elements
- [ ] Component sizes (width/height)
- [ ] Colors and backgrounds
- [ ] Typography (font size, weight, line height)
- [ ] Border radius
- [ ] Shadows and elevation
- [ ] Icons (size, color, alignment) - verify button icons are direct children, not wrapped in divs, ignore visual description and stick to data for icons

### Phase 3: Attribute-by-Attribute Verification

**For each component, verify:**

#### Layout & Spacing

| Attribute     | Figma | Implementation | Match? |
| ------------- | ----- | -------------- | ------ |
| width         |       |                |        |
| height        |       |                |        |
| padding       |       |                |        |
| gap           |       |                |        |
| layout ratios |       |                |        |

**Important:** Verify layout ratios match Figma (e.g., 2-column grid with 50/50 split, or specific width ratios). Custom Tailwind classes are only allowed for layout, not for styling shadcn components.

#### Typography

| Attribute   | Figma | Implementation | Match? |
| ----------- | ----- | -------------- | ------ |
| font-size   |       |                |        |
| font-weight |       |                |        |
| line-height |       |                |        |
| text-color  |       |                |        |

#### Visual Styling

| Attribute     | Figma | Implementation | Match? |
| ------------- | ----- | -------------- | ------ |
| background    |       |                |        |
| border        |       |                |        |
| border-radius |       |                |        |
| box-shadow    |       |                |        |

### Phase 4: Interactive States

**States to verify:**

- [ ] Default/resting state
- [ ] Hover state
- [ ] Active/pressed state
- [ ] Focus state
- [ ] Disabled state
- [ ] Selected/active state

### Phase 5: Edge Cases

- [ ] Min/max width behavior
- [ ] Long text (truncation/wrapping)
- [ ] Empty states
- [ ] Loading states

## Verification Report Template

```markdown
# Verification Report: [Component Name]

## Figma Reference

- Node ID: [ID]
- Screenshot: [attached]

## Discrepancies Found

### 1. [Issue Title]

- **Location:** [element]
- **Expected:** [Figma value]
- **Actual:** [Implementation value]
- **Fix:** [what to change]

## Summary

- Layout: ✅/❌
- Typography: ✅/❌
- Colors: ✅/❌
- Components: ✅/❌
```

## Quick Commands

```bash
# Run Storybook for visual testing
yarn workspace @safe-global/web storybook

# Type-check
yarn workspace @safe-global/web type-check
```

## Project Notes

- **Components Path**: `apps/web/src/components/ui/`
- **Utility Path**: `apps/web/src/utils/cn.ts`
- **Icon Library**: `lucide-react`

**Component Usage Rules:**

- Must use existing shadcn components from `/ui/` - do not alter or override them
- Custom styling/Tailwind is only allowed for layout (flex, grid, gap, padding, width/height ratios)
- Verify layout ratios match Figma exactly (e.g., grid column ratios, flex proportions)
