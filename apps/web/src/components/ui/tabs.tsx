import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Tabs Component
 *
 * Tabbed interface (list of triggers and content panels).
 *
 * @see https://ui.shadcn.com/docs/components/base/tabs
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="account" className="w-[400px]">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Make changes to your account here.</TabsContent>
 *   <TabsContent value="password">Change your password here.</TabsContent>
 * </Tabs>
 * ```
 *
 * @remarks
 * Key Props:
 * - Tabs (Root): `defaultValue`, `value`, `onValueChange`
 * - Tabs (Root): `orientation` ('horizontal' | 'vertical')
 * - TabsList: `variant` ('underline' | 'toggle'); on `underline`, `tone` ('brand' | 'neutral');
 *   on `toggle`, `size` ('default' | 'lg')
 * - TabsTrigger: `value`, `disabled`
 */

function Tabs({ className, orientation = 'horizontal', ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('gap-2 group/tabs flex data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  )
}

// Two public tab families:
//  - `underline` — flush-underline tabs. `tone="brand"` is the bold, primary-coloured page nav
//    (NavTabs: Assets/Settings/Transactions); `tone="neutral"` (default) is the lighter in-content
//    look (Spaces address book, members).
//  - `toggle` — pill-on-track switch. `size="default"` is the compact muted-track switch (SecurityHub
//    drawer); `size="lg"` is the large paper-track welcome switch (Accounts/Workspaces).
// Each (variant, tone|size) pair maps to one internal `look`, emitted as data-variant so TabsTrigger
// (styled off the list's data-variant) remains the single source of truth for the per-look treatment.
const tabsListVariants = cva(
  'rounded-lg p-[3px] group-data-horizontal/tabs:h-9 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      look: {
        default: 'bg-muted',
        line: 'h-auto gap-1 rounded-none bg-transparent p-0',
        nav: 'h-auto gap-6 rounded-none bg-transparent p-0',
        // group-data-horizontal:h-auto overrides the base's horizontal h-9 (same variant prefix so
        // twMerge collapses them) — the track must grow around the h-9 pills plus the p-1 gutter.
        segmented: 'h-auto group-data-horizontal/tabs:h-auto gap-1 bg-[var(--color-background-paper)] p-1',
      },
    },
    defaultVariants: {
      look: 'default',
    },
  },
)

type TabsListVariant = 'underline' | 'toggle'
type TabsListTone = 'brand' | 'neutral'
type TabsListSize = 'default' | 'lg'

const resolveLook = (variant: TabsListVariant, tone: TabsListTone, size: TabsListSize) =>
  variant === 'underline' ? (tone === 'brand' ? 'nav' : 'line') : size === 'lg' ? 'segmented' : 'default'

function TabsList({
  className,
  variant = 'toggle',
  tone = 'neutral',
  size = 'default',
  ...props
}: TabsPrimitive.List.Props & {
  variant?: TabsListVariant
  tone?: TabsListTone
  size?: TabsListSize
}) {
  const look = resolveLook(variant, tone, size)
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={look}
      className={cn(tabsListVariants({ look }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "cursor-pointer gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        'group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm dark:group-data-[variant=default]/tabs-list:data-active:border-border dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30 dark:group-data-[variant=default]/tabs-list:data-active:text-foreground',
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:text-foreground',
        // nav variant: compact brand-coloured triggers (primary idle/active), transparent bg
        'group-data-[variant=nav]/tabs-list:h-auto group-data-[variant=nav]/tabs-list:flex-none group-data-[variant=nav]/tabs-list:px-0 group-data-[variant=nav]/tabs-list:pb-2 group-data-[variant=nav]/tabs-list:font-bold group-data-[variant=nav]/tabs-list:bg-transparent',
        'group-data-[variant=nav]/tabs-list:text-[var(--color-primary-light)] group-data-[variant=nav]/tabs-list:hover:text-[var(--color-primary-main)] group-data-[variant=nav]/tabs-list:data-active:text-[var(--color-primary-main)] group-data-[variant=nav]/tabs-list:data-active:bg-transparent group-data-[variant=nav]/tabs-list:data-active:shadow-none',
        // Underline: shared pseudo-element. line sits 5px below the trigger; nav sits flush
        // to the bottom (bottom-0) so it isn't clipped inside an overflow scroll container,
        // and uses the brand primary colour.
        'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5',
        'group-data-[variant=line]/tabs-list:after:bottom-[-5px] group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        'group-data-[variant=nav]/tabs-list:after:bottom-0 group-data-[variant=nav]/tabs-list:after:bg-[var(--color-primary-main)] group-data-[variant=nav]/tabs-list:data-active:after:opacity-100',
        // segmented pill: large rounded pills on the paper track; the active pill takes the secondary surface
        'group-data-[variant=segmented]/tabs-list:h-9 group-data-[variant=segmented]/tabs-list:flex-none group-data-[variant=segmented]/tabs-list:rounded-lg group-data-[variant=segmented]/tabs-list:px-6 group-data-[variant=segmented]/tabs-list:py-2 group-data-[variant=segmented]/tabs-list:text-xl group-data-[variant=segmented]/tabs-list:font-semibold',
        'group-data-[variant=segmented]/tabs-list:text-[var(--color-text-secondary)] group-data-[variant=segmented]/tabs-list:hover:text-[var(--color-text-primary)] group-data-[variant=segmented]/tabs-list:data-active:bg-[var(--color-background-secondary)] group-data-[variant=segmented]/tabs-list:data-active:text-[var(--color-text-primary)] group-data-[variant=segmented]/tabs-list:data-active:shadow-none',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel data-slot="tabs-content" className={cn('text-sm flex-1 outline-none', className)} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
