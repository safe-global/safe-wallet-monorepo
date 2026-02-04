# Figma to Code Reference

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
