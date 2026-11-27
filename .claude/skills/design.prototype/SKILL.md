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

**Goal:** besides a good design, produce a diff that is a pleasure to review. A developer should be able to skim it, see that it is only markup and touches no business logic, and approve it quickly. Keep that goal in mind at every step.

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

## Step 3: Create the Code

Lay the prototype out the way a developer would build the real feature, so each file can be copied into the codebase as it is. Never put a whole screen in one file.

| What        | Where                                                                                          | Contains                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Sections    | `packages/views/src/features/<feature>/components/<Section>/<Section>.tsx` (plus `index.ts`)   | Pure markup from props                                                                               |
| Screen      | `packages/views/src/features/<feature>/components/<Name>Page/<Name>Page.tsx` (plus `index.ts`) | The layout that composes the sections, also pure markup from props                                   |
| Sample data | `apps/web/src/features/<feature>/prototype/sampleData.ts`                                      | Only data                                                                                            |
| Hooks       | `apps/web/src/features/<feature>/prototype/hooks/use<Concern>.ts`                              | One small hook per concern, such as the current step of a flow, the selected item or a form's values |
| Container   | `apps/web/src/features/<feature>/prototype/<Name>Prototype.tsx`                                | Calls the hooks and renders `<Name>Page` with their results, nothing else                            |

`<feature>` is the existing feature the prototype belongs to (for example `spaces` or `safe-shield`). Put new views next to the views that feature already has.

**Rules**:

- Use only shadcn/ui components from `packages/views/src/components/ui/`
- No custom styling on components
- Use layout-only Tailwind classes on wrapper `div`s

**Views (sections and screen)** only turn props into markup:

- Before writing new markup, look in `packages/views` for a view that already renders it, and reuse it.
- In a view, write only markup and shadcn components, layout classes and variants, copy, `items.map(...)` over a prop, and `cond && …` or `a ? b : c` on a prop.
- A view does not compute, format, sort, filter or decide anything. Pass it the finished values: `"1,250.00 USDC"`, not a number to format. Handlers only call the callback prop they were given (`onClick={onConfirm}`).
- The only state a view may hold is what the eye sees and nothing else reads: open or closed, hovered, the selected tab (`useState`). No effects, timers, `window` or `document`.
- Views do not import from the app (`@/…`), the store, hooks that fetch data, or analytics. The package's lint rejects them.

**Logic (hooks and container)** stays small and separate:

- Each hook does one thing and returns finished values and callbacks for the views.
- The container renders only `<Name>Page` with the hooks' results. It has no markup, class names or copy of its own.
- For a prototype on live data, the hooks read real app data instead of `sampleData.ts`. Nothing else changes.

If the prototype truly needs to break one of these rules, it may; they are defaults, not hard limits. This only changes how the code is organised: the user sees the same Storybook story, so there is nothing to explain to them.

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
// packages/views/src/features/<feature>/components/SummaryCard/SummaryCard.tsx
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

// packages/views/src/features/<feature>/components/MyPage/MyPage.tsx
import * as React from 'react'

import { Button } from '@safe-global/views/components/ui/button'
import { SummaryCard } from '../SummaryCard'

export const MyPage = ({ balance, onRefresh }: { balance: string; onRefresh: () => void }): React.ReactElement => (
  <div className="flex flex-col gap-6 p-6">
    <h2 className="text-xl font-semibold">Overview</h2>
    <SummaryCard title="Balance" value={balance} />
    <Button variant="outline" onClick={onRefresh}>
      Refresh
    </Button>
  </div>
)

// apps/web/src/features/<feature>/prototype/hooks/useBalance.ts
import { useState } from 'react'

import { SAMPLE_BALANCES } from '../sampleData'

export const useBalance = () => {
  const [index, setIndex] = useState(0)
  return { balance: SAMPLE_BALANCES[index], onRefresh: () => setIndex((i) => (i + 1) % SAMPLE_BALANCES.length) }
}

// apps/web/src/features/<feature>/prototype/MyPrototype.tsx
import { MyPage } from '@safe-global/views/features/<feature>/components/MyPage'

import { useBalance } from './hooks/useBalance'

export const MyPrototype = () => <MyPage {...useBalance()} />
```

## Step 4: Create Story

**Location**: `apps/web/src/features/<feature>/prototype/<Name>Prototype.stories.tsx`

**Template**:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyPrototype } from './MyPrototype'

const meta = {
  title: 'Design System/Prototypes/My Prototype',
  component: MyPrototype,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MyPrototype>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
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
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/web storybook
```

## Naming Convention

| Item      | Format                                     | Example                                          |
| --------- | ------------------------------------------ | ------------------------------------------------ |
| Section   | `<Section>/<Section>.tsx`                  | `SummaryCard/SummaryCard.tsx`                    |
| Screen    | `<Name>Page/<Name>Page.tsx`                | `SecurityHubPage/SecurityHubPage.tsx`            |
| Container | `<Name>Prototype.tsx`                      | `SecurityHubPrototype.tsx`                       |
| Story     | `<Name>Prototype.stories.tsx`              | `SecurityHubPrototype.stories.tsx`               |
| Title     | `Design System/Prototypes/<Name>`          | `Design System/Prototypes/Security Hub`          |
| Slug      | `design-system-prototypes-<name>--default` | `design-system-prototypes-security-hub--default` |

## Project Notes

- **Components Path**: `packages/views/src/components/ui/`
- **Utility Path**: `@safe-global/views/utils/cn`
- **Icon Library**: `lucide-react`
- **Views Path**: `packages/views/src/features/<feature>/components/`
- **Prototype Logic and Stories Path**: `apps/web/src/features/<feature>/prototype/`
- **Storybook**: `yarn workspace @safe-global/web storybook`
