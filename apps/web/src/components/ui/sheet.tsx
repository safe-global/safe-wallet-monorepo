import * as React from 'react'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

/**
 * Sheet Component
 *
 * Slide-over panel (dialog that slides in from an edge).
 *
 * @see https://ui.shadcn.com/docs/components/base/sheet
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger render={<Button />}>Open</SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Title</SheetTitle>
 *       <SheetDescription>Description</SheetDescription>
 *     </SheetHeader>
 *     Content
 *     <SheetFooter>
 *       <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 *
 * @remarks
 * Key Props:
 * - SheetContent: `side` ('top' | 'right' | 'bottom' | 'left'), `variant` ('default' | 'floating'),
 *   `size` ('sm' | 'md' | 'lg' | 'auto'), `surface` ('card' | 'paper'), `padding` ('none' | 'md'), `showCloseButton`
 * - SheetHeader / SheetFooter: `divided` (true = full border, 'subtle' = border-border/50)
 * - Root / Trigger / Close: see Base UI dialog
 *
 * @remarks
 * The base keeps its side-scoped `data-[side]:w-*` widths; the `size` tokens layer on top for opt-in
 * widths. `variant="floating"` uses important (`!`) utilities to detach the panel from the viewport edge
 * (margin, rounded corners, no border) — those beat the side-scoped base classes without call-site `!`.
 */

const sheetContentVariants = cva(
  'bg-background data-open:animate-in data-closed:animate-out data-[side=right]:data-closed:slide-out-to-right-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=top]:data-closed:slide-out-to-top-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=bottom]:data-open:slide-in-from-bottom-10 fixed z-[var(--z-overlay)] flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b',
  {
    variants: {
      variant: {
        default: '',
        floating:
          'inset-y-3! right-3! h-auto! max-w-[calc(100vw-24px)]! rounded-3xl border-0! shadow-xl overflow-hidden',
      },
      // Widths are data-[side]-scoped so they match the base positioning specificity and actually
      // win for left/right sheets (a plain `w-*` would be beaten by base `data-[side]:*`). Top/bottom
      // sheets take full width via `data-[side]:inset-x-0`, so `size` intentionally only sets side widths.
      size: {
        sm: 'data-[side=left]:w-3/4 data-[side=right]:w-3/4 data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm',
        md: 'data-[side=left]:w-[440px] data-[side=right]:w-[440px] data-[side=left]:max-w-[calc(100vw-24px)] data-[side=right]:max-w-[calc(100vw-24px)]',
        lg: 'data-[side=left]:w-[700px] data-[side=right]:w-[700px] data-[side=left]:max-w-[100vw] data-[side=right]:max-w-[100vw]',
        auto: 'data-[side=left]:w-auto data-[side=right]:w-auto data-[side=left]:max-w-none data-[side=right]:max-w-none',
      },
      surface: {
        card: 'bg-card',
        paper: 'bg-[var(--color-background-paper)]',
      },
      padding: {
        none: 'p-0',
        md: 'p-6',
      },
    },
    // Default to `sm` so sheets that don't set `size` keep the original w-3/4 + sm:max-w-sm widths.
    defaultVariants: {
      size: 'sm',
    },
  },
)

const sheetHeaderVariants = cva('gap-1.5 p-4 flex flex-col', {
  variants: {
    divided: {
      true: 'border-b',
      subtle: 'border-b border-border/50',
    },
  },
})

const sheetFooterVariants = cva('gap-2 p-4 mt-auto flex flex-col', {
  variants: {
    divided: {
      true: 'border-t',
      subtle: 'border-t border-border/50',
    },
  },
})

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  const portalContainer = usePortalContainer()
  return <SheetPrimitive.Portal data-slot="sheet-portal" container={portalContainer} {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-[var(--z-overlay)]',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  overlayClassName,
  children,
  side = 'right',
  showCloseButton = true,
  variant,
  size,
  surface,
  padding,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
  overlayClassName?: string
} & VariantProps<typeof sheetContentVariants>) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetContentVariants({ variant, size, surface, padding }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({
  className,
  divided,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof sheetHeaderVariants>) {
  return <div data-slot="sheet-header" className={cn(sheetHeaderVariants({ divided }), className)} {...props} />
}

function SheetFooter({
  className,
  divided,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof sheetFooterVariants>) {
  return <div data-slot="sheet-footer" className={cn(sheetFooterVariants({ divided }), className)} {...props} />
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title data-slot="sheet-title" className={cn('text-foreground font-medium', className)} {...props} />
  )
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
