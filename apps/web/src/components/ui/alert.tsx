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
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/?node-id=58-5416
 *
 * Intentional differences from Figma:
 * - Figma specs warning in light mode only (Tailwind yellow/50, /500, /700). Those hexes back the
 *   warning-subtle / warning-accent / warning-strong tokens in light (see shadcn.css); dark mode
 *   keeps the brand warning tint since the file has no dark spec.
 * - Muted alerts show a 16px radius in Figma; all variants share `rounded-md` (12px) here.
 *
 * Changelog (from Figma):
 * - 2026-08-06: Added `info` variant from the "Muted / Info" column (node 4316-13083):
 *   muted background, foreground text, muted-foreground icons, no border.
 * - 2026-08-06: Synced `warning` with the muted warning column (node 4316-12854): border
 *   removed, icon takes the brighter `warning-accent` instead of the text ink.
 * - 2026-08-06: Added `outlined` (default true) for `destructive` and `warning`. Outlined is the
 *   card style with the default border (nodes 1255-182975 / 4316-12819); `outlined={false}` is
 *   the borderless severity tint (nodes 1255-183763 / 4316-12854).
 */

const alertVariants = cva(
  "grid gap-0.5 rounded-md border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-24 has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert",
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
      className={cn('text-foreground absolute top-1/2 right-4 -translate-y-1/2', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
