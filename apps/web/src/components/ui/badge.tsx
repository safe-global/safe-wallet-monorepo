import type { ComponentProps } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Badge Component
 *
 * Displays a badge or a component that looks like a badge.
 *
 * @see https://ui.shadcn.com/docs/components/base/badge
 *
 * @example
 * ```tsx
 * <Badge variant="secondary">Badge</Badge>
 * ```
 *
 * @remarks
 * Key Props:
 * - `variant` ('default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info' | 'positive' | 'brand' | 'negative' | 'subtle' | 'ghost' | 'link')
 * - `size` ('sm' | 'default' | 'lg' | 'auto' | 'status')
 * - `shape` ('pill' | 'tag' | 'status')
 * - `render`
 * - `className`
 */

const badgeVariants = cva(
  'gap-1 border border-transparent font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20 border-transparent',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        // Warning is the one tint with a theme-flipping ink pair (warning1), so it can colour its
        // own text and still clear AA. For the rest the tint carries the meaning and the text stays
        // default foreground — see the note in chip.tsx: `--color-*-dark` is a single accent reused
        // in both themes, so as ink on its own tint it fails AA (success 3.7:1, info 2.0:1).
        warning: 'bg-warning-subtle text-warning-strong border-transparent',
        success:
          'bg-accent-secondary text-accent-secondary-foreground border-transparent dark:bg-accent-secondary/20 dark:text-accent-success',
        info: 'bg-info-subtle text-foreground border-transparent',
        positive: 'bg-success-subtle text-foreground border-transparent',
        // Figma "Badge small" plan/trial pairing: green-500 ink on the light green fill (design-approved despite AA).
        brand: 'bg-success-tint text-badge-dot-success border-transparent',
        negative: 'bg-destructive/10 text-destructive border-transparent dark:bg-destructive/20',
        // Neutral tint for counts and metadata that carry no status — the fill only lifts the pill
        // off the surface, so it follows the foreground colour in both themes.
        subtle: 'bg-foreground/5 text-muted-foreground border-transparent',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Geometry lives on `size`/`shape`, never on a call-site className.
      size: {
        sm: 'h-5 px-1.5 py-0 text-[10px] leading-none',
        default: 'h-5 px-2 py-0.5 text-xs',
        lg: 'h-6 px-2.5 py-0 text-sm',
        auto: 'h-auto px-2.5 py-1 text-xs',
        // The Obra DS status badge, as used by the 2FA badges. Pair with `shape="status"`.
        status: 'h-6 gap-1.5 px-2 py-[3px] text-xs leading-4',
      },
      shape: {
        pill: 'rounded-4xl',
        tag: 'rounded-sm',
        status: 'rounded-lg',
      },
    },
    // The Obra DS status badge recolours the shared tints (Figma nodes 4033-8332 / 4033-8415):
    // success is the brand success pairing (theme-flipping), warning gets a badge-scoped dark
    // pairing. Scoped to `size="status"` so the plain variants stay as they are everywhere else.
    compoundVariants: [
      { variant: 'success', size: 'status', className: 'bg-success-subtle text-success-strong' },
      { variant: 'warning', size: 'status', className: 'bg-badge-warning-subtle text-badge-warning-strong' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'pill',
    },
  },
)

/**
 * The status dot the Obra DS uses in place of an icon on status badges. It reads the
 * enclosing badge's `data-variant` so one dot serves every status; any variant without
 * a dot colour of its own falls back to the badge's ink.
 */
function BadgeDot({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden="true"
      className={cn(
        'size-1.5 shrink-0 rounded-full bg-current',
        'group-data-[variant=success]/badge:bg-badge-dot-success',
        'group-data-[variant=warning]/badge:bg-badge-dot-warning',
        className,
      )}
      {...props}
    />
  )
}

function Badge({
  className,
  variant = 'default',
  size,
  shape,
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant, size, shape })),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, BadgeDot, badgeVariants }
