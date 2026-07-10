import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'
import { usePortalContainer } from '@/components/ui/ShadcnProvider'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

/**
 * Dialog Component
 *
 * Displays a modal dialog centered on screen with an overlay.
 *
 * @see https://ui.shadcn.com/docs/components/base/dialog
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger render={<Button />}>Open</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>Description</DialogDescription>
 *     </DialogHeader>
 *     Content
 *     <DialogFooter>
 *       <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * @remarks
 * Key Props:
 * - DialogContent: `size` ('default' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', default 'default' = max-w-[500px];
 *   mirrors ModalDialog's MAX_WIDTH_MAP), `padding` ('none' | 'md'; Content has no body padding by default),
 *   `surface` ('default' | 'card' | 'paper'), `showCloseButton`, `keepMounted`
 * - DialogHeader / DialogFooter: `divided` (true = full border, 'subtle' = border-border/50)
 *
 * Widths, padding, surface and header/footer dividers belong to these props, not raw `className` utilities.
 */

const dialogContentVariants = cva(
  'bg-dialog data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-starting-style:opacity-0 data-ending-style:opacity-0 fixed top-[50%] left-[50%] z-[var(--z-overlay)] w-full -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-lg duration-200',
  {
    variants: {
      size: {
        default: 'max-w-[500px]',
        xs: 'max-w-[444px]',
        sm: 'max-w-[600px]',
        md: 'max-w-[900px]',
        lg: 'max-w-[1200px]',
        xl: 'max-w-[1536px]',
      },
      padding: {
        none: 'p-0',
        md: 'p-6',
      },
      surface: {
        default: '',
        card: 'bg-card',
        paper: 'bg-[var(--color-background-paper)]',
      },
    },
    defaultVariants: {
      size: 'default',
      surface: 'default',
    },
  },
)

const dialogHeaderVariants = cva('gap-1.5 p-4 flex flex-col', {
  variants: {
    divided: {
      true: 'border-b',
      subtle: 'border-b border-border/50',
    },
  },
})

const dialogFooterVariants = cva('gap-2 p-4 mt-auto flex flex-col', {
  variants: {
    divided: {
      true: 'border-t',
      subtle: 'border-t border-border/50',
    },
  },
})

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  const portalContainer = usePortalContainer()
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={portalContainer} {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-starting-style:opacity-0 data-ending-style:opacity-0 bg-backdrop fixed inset-0 z-[var(--z-overlay)]',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  keepMounted,
  size,
  padding,
  surface,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  keepMounted?: boolean
} & VariantProps<typeof dialogContentVariants>) {
  return (
    <DialogPortal keepMounted={keepMounted}>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ size, padding, surface }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  divided,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof dialogHeaderVariants>) {
  return <div data-slot="dialog-header" className={cn(dialogHeaderVariants({ divided }), className)} {...props} />
}

function DialogFooter({
  className,
  divided,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof dialogFooterVariants>) {
  return <div data-slot="dialog-footer" className={cn(dialogFooterVariants({ divided }), className)} {...props} />
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-foreground font-medium text-lg', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
