# Figma to Code Reference

## Typography (CRITICAL)

**Never hardcode Tailwind classes for text.** Always use the `Typography` component with variants.

```tsx
import { Typography } from '@/components/ui/typography'

// ✅ Correct
<Typography variant="h2" align="center">Invite team members</Typography>
<Typography variant="paragraph">Body text here.</Typography>
<Typography variant="paragraph-medium">Emphasized text.</Typography>

// ❌ Wrong — no raw Tailwind for text
<p className="text-[30px] font-semibold">Invite team members</p>
<h2 className="text-3xl font-semibold">Heading</h2>
```

### How to get the Figma style and map to Typography

1. **Get style from node**: Call `get_variable_defs(fileKey, nodeId)` — returns variables used by that text node.

2. **Extract style name**: Look for keys whose value is `Font(...)` — that key is the Figma style name.
   - Example: `"heading 2": "Font(family: ...)"` → style name is `heading 2`
   - Example: `"paragraph small/medium": "Font(...)"` → style name is `paragraph small/medium`

3. **Map to variant**: Use the table below.

### Figma style name → Typography variant mapping

| Figma variable / style   | Typography variant                 |
| ------------------------ | ---------------------------------- |
| heading 1                | `variant="h1"`                     |
| heading 2                | `variant="h2"`                     |
| heading 3                | `variant="h3"`                     |
| heading 4                | `variant="h4"`                     |
| paragraph/regular        | `variant="paragraph"`              |
| paragraph/medium         | `variant="paragraph-medium"`       |
| paragraph/bold           | `variant="paragraph-bold"`         |
| paragraph/small          | `variant="paragraph-small"`        |
| paragraph/small + medium | `variant="paragraph-small-medium"` |
| paragraph/mini           | `variant="paragraph-mini"`         |
| paragraph/mini + medium  | `variant="paragraph-mini-medium"`  |
| paragraph/mini + bold    | `variant="paragraph-mini-bold"`    |
| monospaced               | `variant="code"`                   |

**Align:** Use `align="center"` or `align="right"` when the design has centered/right-aligned text.

**Color:** Use `color="muted"` for muted/secondary text (e.g. `text-muted-foreground`).

## Component Mappings

| Figma Element     | shadcn Component   |
| ----------------- | ------------------ |
| Text Input        | `<Input>`          |
| Select/Dropdown   | `<Select>`         |
| Checkbox          | `<Checkbox>`       |
| Radio             | `<RadioGroup>`     |
| Toggle/Switch     | `<Switch>`         |
| Card/Container    | `<Card>`           |
| Dialog/Modal      | `<Dialog>`         |
| Tabs              | `<Tabs>`           |
| Table             | `<Table>`          |
| Tooltip           | `<Tooltip>`        |
| Badge/Tag         | `<Badge>`          |
| Avatar            | `<Avatar>`         |
| Separator/Divider | `<Separator>`      |
| Skeleton/Loading  | `<Skeleton>`       |
| Alert/Banner      | `<Alert>`          |
| Accordion         | `<Accordion>`      |
| Navigation Menu   | `<NavigationMenu>` |
| Breadcrumb        | `<Breadcrumb>`     |
| Pagination        | `<Pagination>`     |

## Component Properties (shadcn Libraries)

| Component | Key Properties                                  |
| --------- | ----------------------------------------------- |
| Button    | `variant`, `size`, `icon`, `disabled`           |
| Input     | `size`, `disabled`, `error`                     |
| Select    | `size`, `disabled`                              |
| Avatar    | `size`, `src`, `fallback`                       |
| Badge     | `variant`                                       |
| Tabs      | `defaultValue`, individual `TabsTrigger` values |
| Card      | `size` (if available)                           |

## Layout Patterns

```tsx
// Vertical stack with gap
<div className="flex flex-col gap-4">

// Horizontal layout
<div className="flex items-center gap-2">

// Grid layout
<div className="grid grid-cols-2 gap-4 md:grid-cols-3">

// Container with padding
<div className="p-4 md:p-6">

// Full width with max constraint
<div className="w-full max-w-md mx-auto">
```

## Complex Screen Implementation

### Component Decomposition

1. **Identify logical sections** - Each card, panel becomes a subcomponent
2. **Extract reusable patterns** - If pattern appears 2+ times, extract it
3. **Create main orchestrator** - Screen component imports and composes subcomponents

Example structure:

```
showcase/
├── AssetValueCard.tsx
├── PendingTransactionsCard.tsx
├── PortfolioCard.tsx
├── WalletSidebar.tsx
├── WalletDashboard.tsx       # Main orchestrator
└── WalletDashboard.stories.tsx
```

### Data Prop Patterns

```tsx
interface Transaction {
  id: string
  title: string
  date: string
}

interface Props {
  transactions: Transaction[]
  onViewAll?: () => void
  onItemClick?: (id: string) => void
}
```

### Component Dependencies

Some shadcn components have hidden dependencies:

- `sidebar` requires `use-mobile` hook, `sheet`, `skeleton`, `tooltip`
- Always run type-check after installing
- Install missing: `npx shadcn@latest add <dep>`

### Naming Conventions

- `*Card` - Self-contained card components
- `*Sidebar` / `*Nav` - Navigation components
- `*Dashboard` / `*Screen` / `*Page` - Full page orchestrators
- Use `PascalCase` for component names

## Validation Checklist

**Before starting:**

- [ ] Checked `data-name` attributes for component types
- [ ] Verified grouped elements aren't Tabs mistaken for Buttons
- [ ] Extracted variant from CSS variable names
- [ ] Compared similar components to identify size differences

**Before completing:**

- [ ] All UI uses shadcn components (no custom primitives)
- [ ] Custom Tailwind limited to layout/spacing
- [ ] No hardcoded colors - uses theme variables
- [ ] Component is typed with TypeScript
- [ ] Storybook story created
- [ ] Import paths fixed (`@/utils/cn`)
