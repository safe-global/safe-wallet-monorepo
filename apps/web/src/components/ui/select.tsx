import * as React from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react'

/**
 * Select Component
 *
 * Select dropdown for choosing one option from a list.
 *
 * @see https://ui.shadcn.com/docs/components/base/select
 *
 * @example
 * ```tsx
 * <Select defaultValue="light">
 *   <SelectTrigger className="w-[180px]">
 *     <SelectValue placeholder="Theme" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectGroup>
 *       <SelectItem value="light">Light</SelectItem>
 *       <SelectItem value="dark">Dark</SelectItem>
 *       <SelectItem value="system">System</SelectItem>
 *     </SelectGroup>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * @remarks
 * Key Props:
 * - Select (Root): `defaultValue`, `value`, `onValueChange`, `items`
 * - SelectTrigger: `variant` ('default' | 'ghost')
 * - SelectContent: `side`, `align`, `alignItemWithTrigger`
 *
 * NB: when item labels differ from their values, pass an `items` value→label map to the
 * Root (or custom children to `SelectValue`) — otherwise the closed trigger renders the
 * raw value, since the labels live in the unmounted popup.
 */

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn('scroll-my-1 p-1', className)} {...props} />
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value data-slot="select-value" className={cn('flex flex-1 text-left', className)} {...props} />
  )
}

/**
 * SelectTrigger skin. One height (`min-h-9`) that grows for rich multi-line values (e.g. a token
 * row). The `data-size="default"` attribute is kept as a stable hook so a caller can still override
 * height via `data-[size=default]:h-*` (resolved through tailwind-merge).
 * - `default` — bordered field on the page background.
 * - `ghost`   — border/shadow/bg reset for inline/embedded triggers.
 */
const selectTriggerVariants = cva(
  "data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-2 text-sm transition-[color,box-shadow] focus-visible:ring-[3px] aria-invalid:ring-[3px] data-[size=default]:min-h-9 *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'border-border dark:bg-input/30 dark:hover:bg-input/50 rounded-md border bg-transparent px-3 py-2 shadow-xs',
        ghost:
          'rounded-md border-0 bg-transparent px-0 py-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function SelectTrigger({
  className,
  variant,
  iconWrapperClassName,
  children,
  ...props
}: SelectPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants> & {
    iconWrapperClassName?: string
  }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size="default"
      className={cn(selectTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      <span className={cn('flex items-center shrink-0', iconWrapperClassName)}>
        <SelectPrimitive.Icon
          render={<ChevronDownIcon className="text-muted-foreground size-4 pointer-events-none" />}
        />
      </span>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  collisionBoundary,
  collisionAvoidance,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    | 'align'
    | 'alignOffset'
    | 'side'
    | 'sideOffset'
    | 'alignItemWithTrigger'
    | 'collisionBoundary'
    | 'collisionAvoidance'
  >) {
  const portalContainer = usePortalContainer()
  return (
    <SelectPrimitive.Portal container={portalContainer}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        {...(collisionBoundary !== undefined && { collisionBoundary })}
        {...(collisionAvoidance !== undefined && { collisionAvoidance })}
        className="isolate z-[var(--z-overlay)]"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex min-w-36 max-h-(--available-height) w-(--anchor-width) flex-col overflow-hidden rounded-md shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 relative isolate z-[var(--z-overlay)] origin-(--transform-origin) data-[align-trigger=true]:animate-none',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List
            data-slot="select-list"
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-1.5 scroll-py-1 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2 rounded-sm py-2 pr-8 pl-3 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border -mx-1 my-1 h-px pointer-events-none', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
