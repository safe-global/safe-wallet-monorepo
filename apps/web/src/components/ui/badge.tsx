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
 * - `variant` ('default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info' | 'positive' | 'negative' | 'ghost' | 'link')
 * - `size` ('sm' | 'default' | 'lg' | 'auto')
 * - `shape` ('pill' | 'tag')
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
        warning: 'bg-warning-subtle text-warning-strong border-transparent',
        success:
          'bg-accent-secondary text-accent-secondary-foreground border-transparent dark:bg-accent-secondary/20 dark:text-accent-success',
        info: 'bg-info-subtle text-info-strong border-transparent',
        positive: 'bg-success-subtle text-success-strong border-transparent',
        negative: 'bg-destructive/10 text-destructive border-transparent dark:bg-destructive/20',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      // Geometry lives on `size`/`shape`, never on a call-site className.
      size: {
        sm: 'h-5 px-1.5 py-0 text-[10px] leading-none',
        default: 'h-5 px-2 py-0.5 text-xs',
        lg: 'h-6 px-2.5 py-0 text-sm',
        auto: 'h-auto px-2.5 py-1 text-xs',
      },
      shape: {
        pill: 'rounded-4xl',
        tag: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'pill',
    },
  },
)

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

export { Badge, badgeVariants }
