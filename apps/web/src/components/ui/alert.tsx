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
 * - Alert: `variant` ('default' | 'destructive' | 'warning' | 'success')
 * - AlertAction: for action buttons (positioned top-right)
 */

const alertVariants = cva(
  "grid gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert",
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
        // Body copy stays default foreground, as MUI's `<Alert severity>` did (text.primary). The
        // tint and the icon carry the severity: `--color-*-dark` is identical in both themes, so as
        // ink it dropped warning to 3.14:1 in dark and success to ~3.7:1 in both. It clears the 3:1
        // graphics threshold as an icon, which is where it belongs.
        // `--color-warning-background` (the coral-tinted tint) with a coral icon, not the amber
        // `warning-subtle`/`warning1` scale — and no border, matching the rest of our surfaces.
        warning:
          'bg-[var(--color-warning-background)] text-foreground border-transparent *:[svg]:text-[var(--color-warning-main)]',
        success: 'bg-success-subtle text-foreground border-success-muted *:[svg]:text-success-strong',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-semibold group-has-[>svg]/alert:col-start-2 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
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
        'text-muted-foreground text-sm text-balance md:text-pretty [&_p:not(:last-child)]:mb-4 [&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-action" className={cn('absolute top-2.5 right-3', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
