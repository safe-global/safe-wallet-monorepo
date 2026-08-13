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
 * - `variant` ('default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'lightWarning' | 'success' | 'ghost' | 'link')
 * - `size` ('default' | 'sm' — `sm` matches the Obra DS status badge)
 * - `render`
 * - `className`
 */

const badgeVariants = cva(
  'h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        warning: 'bg-warning-subtle text-warning-strong',
        lightWarning: 'bg-warning-light-subtle text-warning-light-strong [--badge-dot:var(--color-warning-light-dot)]',
        success: 'bg-success-subtle text-success-strong [--badge-dot:var(--color-success-dot)]',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'h-6 gap-1.5 rounded-lg py-[3px] leading-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * The status dot the Obra DS uses in place of an icon on small badges. Takes its
 * colour from the `--badge-dot` custom property set by the badge variant, so it
 * stays correct in both themes.
 */
function BadgeDot({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden="true"
      className={cn('size-1.5 shrink-0 rounded-full bg-[var(--badge-dot,currentColor)]', className)}
      {...props}
    />
  )
}

function Badge({
  className,
  variant = 'default',
  size = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant, size })),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
      size,
    },
  })
}

export { Badge, BadgeDot, badgeVariants }
