---
name: design.prototype
description: Creates a Storybook UI prototype from a PRD-style input using existing shadcn/ui components, subtle visual tone, and a clear hierarchy. Use when the user invokes /design.prototype or asks for a prototype Storybook story.
argument-hint: '[prd-description]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__cursor-browser-extension__browser_navigate
  - mcp__cursor-browser-extension__browser_wait_for
  - mcp__cursor-browser-extension__browser_take_screenshot
---

# Design Prototype (Storybook)

Create a Storybook prototype from **$ARGUMENTS** using only shadcn/ui components.

**Note:** All shadcn/ui components are already installed and available at `apps/web/src/components/ui/`. Import them directly (e.g., `import { Button } from '@/components/ui/button'`).

## Step 1: Gather Requirements

If missing, ask:

- Target story name (short, Title Case)
- Storybook port (default: 6006)
- Desired variants (single Default or multiple states)
- Component constraints beyond shadcn/ui

## Step 2: Design Process

1. **Intent**: Summarize what the page must achieve in one sentence
2. **Hierarchy**: Define 3–4 priority levels (hero, primary clusters, secondary clusters, info)
3. **Clustering**: Group related settings into sections with headings
4. **Patterns**: Use hero summary, grid clusters, and consistent actions
5. **Tone**: Subtle, calm, non-alarming. Use muted backgrounds and secondary/outline badges

## Step 3: Create Component

**Location**: `apps/web/src/features/design-system/prototypes/<Name>.tsx`

**Rules**:

- Use only shadcn/ui components from `apps/web/src/components/ui/`
- No custom styling on components
- Use layout-only Tailwind classes on wrapper `div`s

**Styling Guidelines:**

DO:

- Use shadcn variants (`variant="outline"`, `size="sm"`)
- Use Tailwind for layout: `flex`, `grid`, `gap-*`, `p-*`
- Prefer using wrapper classes for layout, to use pure shadcn components without added Tailwind classes
- Use CSS variables from shadcn for colors

DON'T:

- Add custom colors (`bg-blue-500`)
- Override shadcn styles
- Hardcode pixel values

**Template**:

```tsx
import * as React from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
// ... other shadcn imports

export const MyPrototype = (): React.ReactElement => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h2 className="text-xl font-semibold">Page Title</h2>
      {/* Layout with shadcn components */}
    </div>
  )
}
```

## Step 4: Create Story

**Location**: `apps/web/src/features/design-system/stories/prototypes/<Name>.stories.tsx`

**Template**:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyPrototype } from '../../prototypes/MyPrototype'

const meta = {
  title: 'Design System/Prototypes/My Prototype',
  component: MyPrototype,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MyPrototype>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // component props if any
  },
}
```

## Step 5: Screenshot Workflow

After writing the story:

```
browser_navigate("http://localhost:<port>/?path=/story/design-system-prototypes-<slug>--default")
browser_wait_for(time: 2)
browser_take_screenshot(fullPage: true)
```

If variants exist, capture each variant.

## Step 6: Verify

```bash
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web storybook
```

## Naming Convention

| Item      | Format                                     | Example                                          |
| --------- | ------------------------------------------ | ------------------------------------------------ |
| Component | `<Name>.tsx`                               | `SecurityHub.tsx`                                |
| Story     | `<Name>.stories.tsx`                       | `SecurityHub.stories.tsx`                        |
| Title     | `Design System/Prototypes/<Name>`          | `Design System/Prototypes/Security Hub`          |
| Slug      | `design-system-prototypes-<name>--default` | `design-system-prototypes-security-hub--default` |

## Project Notes

- **Components Path**: `apps/web/src/components/ui/`
- **Utility Path**: `apps/web/src/utils/cn.ts`
- **Icon Library**: `lucide-react`
- **Prototypes Path**: `apps/web/src/features/design-system/prototypes/`
- **Stories Path**: `apps/web/src/features/design-system/stories/prototypes/`
- **Storybook**: `yarn workspace @safe-global/web storybook`
