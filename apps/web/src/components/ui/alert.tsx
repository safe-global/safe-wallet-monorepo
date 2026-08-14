import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Alert Component
 *
 * Displays a callout for user attention.
 *
 * @see https://ui.shadcn.com/docs/components/base/alert
 *
 * @example
 * ```tsx
 * <Alert variant="default">
 *   <InfoIcon />
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>You can add components using the cli.</AlertDescription>
 *   <AlertAction>
 *     <Button variant="outline">Enable</Button>
 *   </AlertAction>
 * </Alert>
 * ```
 *
 * @remarks
 * Key Props:
 * - Alert: `variant` ('default' | 'destructive' | 'warning' | 'success' | 'info')
 * - Alert: `outlined` (destructive & warning only; default true = card surface with border,
 *   false = borderless severity tint)
 * - AlertAction: for action buttons (positioned top-right)
 */

const alertVariants = cva(
  "grid gap-0.5 rounded-md border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-14 has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert",
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive: 'text-error-strong *:data-[slot=alert-description]:text-error-strong *:[svg]:text-destructive',
        warning: 'text-warning-strong *:data-[slot=alert-description]:text-warning-strong *:[svg]:text-warning-accent',
        success:
          'bg-success-subtle text-success-strong border-success-muted *:data-[slot=alert-description]:text-success-strong *:[svg]:text-current',
        info: 'bg-muted text-foreground border-transparent *:data-[slot=alert-description]:text-foreground *:[svg]:text-muted-foreground',
      },
      // Only `destructive` and `warning` have both designs (see compoundVariants); the other
      // variants ignore this.
      outlined: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'destructive', outlined: true, class: 'bg-card' },
      { variant: 'destructive', outlined: false, class: 'bg-error-subtle border-transparent' },
      { variant: 'warning', outlined: true, class: 'bg-card' },
      { variant: 'warning', outlined: false, class: 'bg-warning-subtle border-transparent' },
    ],
    defaultVariants: {
      variant: 'default',
      outlined: true,
    },
  },
)

function Alert({
  className,
  variant,
  outlined,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant, outlined }), className)} {...props} />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium break-words min-w-0 group-has-[>svg]/alert:col-start-2 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground text-sm font-normal break-words min-w-0 text-balance md:text-pretty [&_p:not(:last-child)]:mb-4 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('text-foreground absolute top-6 right-4 -translate-y-1/2', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
