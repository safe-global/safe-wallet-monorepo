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

**Note:** All shadcn/ui components are already installed and available at `packages/views/src/components/ui/`. Import them directly (e.g., `import { Button } from '@safe-global/views/components/ui/button'`).

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

**Location**: `packages/views/src/features/design-system/prototypes/<Name>/`, with the screen in `index.tsx` and each section in its own file next to it.

**Rules**:

- Use only shadcn/ui components from `packages/views/src/components/ui/`
- No custom styling on components
- Use layout-only Tailwind classes on wrapper `div`s

**Build it as views.** Aim for code a developer can move into the app without reading it line by line: nearly every file is pure markup, and the little logic the prototype needs sits in one place.

- Before writing new markup, look in `packages/views` for a view that already renders it, and reuse it.
- Split the screen into small components, one per section (for example `SummaryCard`, `ChecksList`), each in its own file.
- A section only turns props into markup. In a section, write only:
  - markup and shadcn components;
  - layout classes and variants;
  - copy;
  - `items.map(...)` over a prop;
  - `cond && …` or `a ? b : c` on a prop.
- A section does not compute, format, sort, filter or decide anything. Pass it the finished values: `"1,250.00 USDC"`, not a number to format. Handlers only call the callback prop they were given (`onClick={onConfirm}`).
- The only state a section may hold is what the eye sees and nothing else reads: open or closed, hovered, the selected tab (`useState`). No effects, timers, `window` or `document`.
- Everything else lives in `index.tsx`: the sample data, the prototype's state (the current step, which item is selected) and the callbacks that change it. `index.tsx` passes the results down as props. It is the only file a developer needs to read closely.
- Do not import from the app (`@/…`), the store, hooks that fetch data, or analytics. The package's lint rejects them.

If the prototype truly needs more logic in a section, add it; these are defaults, not hard limits. This only changes how the code is organised: the user sees the same Storybook story, so there is nothing to explain to them.

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
// SummaryCard.tsx
import * as React from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '@safe-global/views/components/ui/card'

export const SummaryCard = ({ title, value }: { title: string; value: string }): React.ReactElement => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{value}</CardContent>
  </Card>
)

// index.tsx
import * as React from 'react'

import { SummaryCard } from './SummaryCard'

export const MyPrototype = ({ title, balance }: { title: string; balance: string }): React.ReactElement => (
  <div className="flex flex-col gap-6 p-6">
    <h2 className="text-xl font-semibold">{title}</h2>
    <SummaryCard title="Balance" value={balance} />
  </div>
)
```

## Step 4: Create Story

**Location**: `packages/views/src/features/design-system/prototypes/<Name>/<Name>.stories.tsx`

**Template**:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyPrototype } from '.'

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
    title: 'Page title',
    balance: '1,250.00 USDC',
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
yarn workspace @safe-global/views type-check
yarn workspace @safe-global/views lint
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

- **Components Path**: `packages/views/src/components/ui/`
- **Utility Path**: `@safe-global/views/utils/cn`
- **Icon Library**: `lucide-react`
- **Prototypes and Stories Path**: `packages/views/src/features/design-system/prototypes/<Name>/`
- **Storybook**: `yarn workspace @safe-global/web storybook`
