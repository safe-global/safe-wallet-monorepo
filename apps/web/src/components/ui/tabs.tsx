import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva, type VariantProps } from 'class-variance-authority'

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
 * - TabsList: `variant` ('default' | 'line')
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

const tabsListVariants = cva(
  'rounded-lg p-[3px] group-data-horizontal/tabs:h-9 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'h-auto gap-1 rounded-none bg-transparent p-0',
        // Top-level page navigation (Assets, Settings, Transactions…): wider gap,
        // brand-coloured triggers with a flush underline. See TabsTrigger below.
        nav: 'h-auto gap-6 rounded-none bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
