'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'

import { cn } from '@/utils/cn'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
import { overlayVariants } from '@/components/ui/overlay'

/**
 * Popover Component
 *
 * Displays rich content in a popover triggered by a button or element.
 *
 * @see https://ui.shadcn.com/docs/components/base/popover
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger render={<Button variant="outline" />}>Open</PopoverTrigger>
 *   <PopoverContent>Popover content here.</PopoverContent>
 * </Popover>
 * ```
 *
 * @remarks
 * Key Props:
 * - PopoverContent: `align`, `alignOffset`, `side`, `sideOffset`, `showBackdrop`
 * - Root / Trigger: see Base UI popover
 */

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  anchor,
  collisionAvoidance,
  showBackdrop = false,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'anchor' | 'collisionAvoidance'
  > & {
    /**
     * Dims and blurs the page behind the popover with the shared overlay scrim.
     *
     * Set this on a popover that reads as a panel — a titled card with its own close button, like
     * the header's Nested Safes, notifications, wallet and WalletConnect popups. Those are modals
     * that happen to be anchored, and without a scrim they float on a page that still looks live.
     *
     * Leave it off for a true dropdown: a menu, a select, a date picker, a filter, a tooltip. Those
     * belong to the control that opened them, and dimming the page around a menu item is wrong.
     *
     * Do NOT set it on a popover opened from inside a dialog or sheet — the scrim paints above that
     * surface and would blur the content the popover belongs to.
     */
    showBackdrop?: boolean
  }) {
  const portalContainer = usePortalContainer()
  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      {showBackdrop && <PopoverPrimitive.Backdrop data-slot="popover-backdrop" className={overlayVariants()} />}
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        collisionAvoidance={collisionAvoidance}
        className="isolate z-[var(--z-overlay)]"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-4 rounded-lg p-4 text-sm shadow-lg ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 z-[var(--z-overlay)] w-72 origin-(--transform-origin) outline-hidden',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-1 text-sm', className)} {...props} />
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={cn('font-medium', className)} {...props} />
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  )
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger }
