import * as React from 'react'
// Base UI 1.2 ships the drawer as a preview API
import { DrawerPreview as DrawerPrimitive } from '@base-ui/react/drawer'

import { cn } from '@safe-global/views/utils/cn'
import { usePortalContainer } from '@safe-global/views/components/ui/ShadcnProvider'
import { overlayVariants } from '@safe-global/views/components/ui/overlay'

/**
 * Drawer Component
 *
 * A panel that slides in from an edge and can be swiped away (built on Base UI Drawer).
 *
 * @see https://base-ui.com/react/components/drawer
 *
 * @example
 * ```tsx
 * <Drawer direction="right">
 *   <DrawerTrigger render={<Button />}>Open</DrawerTrigger>
 *   <DrawerContent>
 *     <DrawerHeader>
 *       <DrawerTitle>Title</DrawerTitle>
 *       <DrawerDescription>Description</DrawerDescription>
 *     </DrawerHeader>
 *     <DrawerFooter>
 *       <Button>Submit</Button>
 *       <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
 *     </DrawerFooter>
 *   </DrawerContent>
 * </Drawer>
 * ```
 *
 * @remarks
 * Key Props:
 * - Root: `open`, `onOpenChange`, `direction` ('top' | 'right' | 'bottom' | 'left', default 'bottom')
 * - Trigger / Close / Content: see Base UI drawer
 *
 * The popup carries `data-swipe-direction` ('up' | 'right' | 'down' | 'left'); target it to style one side.
 */

type DrawerDirection = 'top' | 'right' | 'bottom' | 'left'

const SWIPE_DIRECTION = {
  top: 'up',
  right: 'right',
  bottom: 'down',
  left: 'left',
} as const satisfies Record<DrawerDirection, DrawerPrimitive.Root.Props['swipeDirection']>

function Drawer({
  direction = 'bottom',
  ...props
}: Omit<DrawerPrimitive.Root.Props, 'swipeDirection'> & { direction?: DrawerDirection }) {
  return <DrawerPrimitive.Root data-slot="drawer" swipeDirection={SWIPE_DIRECTION[direction]} {...props} />
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  const portalContainer = usePortalContainer()
  return <DrawerPrimitive.Portal data-slot="drawer-portal" container={portalContainer} {...props} />
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return <DrawerPrimitive.Backdrop data-slot="drawer-overlay" className={cn(overlayVariants(), className)} {...props} />
}

const drawerPopupClasses = [
  'group/drawer-content bg-background fixed flex h-auto flex-col text-sm outline-none transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
  'data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=down]:[transform:translateY(var(--drawer-swipe-movement-y))] data-[swipe-direction=down]:data-starting-style:[transform:translateY(100%)] data-[swipe-direction=down]:data-ending-style:[transform:translateY(100%)]',
  'data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-xl data-[swipe-direction=up]:border-b data-[swipe-direction=up]:[transform:translateY(var(--drawer-swipe-movement-y))] data-[swipe-direction=up]:data-starting-style:[transform:translateY(-100%)] data-[swipe-direction=up]:data-ending-style:[transform:translateY(-100%)]',
  'data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:rounded-l-xl data-[swipe-direction=right]:border-l data-[swipe-direction=right]:sm:max-w-sm data-[swipe-direction=right]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[swipe-direction=right]:data-starting-style:[transform:translateX(100%)] data-[swipe-direction=right]:data-ending-style:[transform:translateX(100%)]',
  'data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:rounded-r-xl data-[swipe-direction=left]:border-r data-[swipe-direction=left]:sm:max-w-sm data-[swipe-direction=left]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[swipe-direction=left]:data-starting-style:[transform:translateX(-100%)] data-[swipe-direction=left]:data-ending-style:[transform:translateX(-100%)]',
]

function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport data-slot="drawer-viewport" className="fixed inset-0 z-[var(--z-overlay)]">
        <DrawerPrimitive.Popup data-slot="drawer-content" className={cn(drawerPopupClasses, className)} {...props}>
          <div className="bg-muted mx-auto mt-4 hidden h-1.5 w-[100px] shrink-0 rounded-full group-data-[swipe-direction=down]/drawer-content:block" />
          {/* Lets a mouse select text in the panel instead of starting a swipe */}
          <DrawerPrimitive.Content className="contents">{children}</DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-content:text-center group-data-[swipe-direction=up]/drawer-content:text-center md:gap-1.5 md:text-left flex flex-col',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-footer" className={cn('gap-2 p-4 mt-auto flex flex-col', className)} {...props} />
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-foreground font-medium', className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
