import { type ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { XIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

/**
 * Chip Component
 *
 * Compact label/tag aligned with the Safe{Wallet} design system. Replaces MUI's `Chip`.
 * For purely presentational status pills prefer `Badge`; use `Chip` when an `onDelete`
 * affordance or chip sizing is needed.
 *
 * @example
 * ```tsx
 * <Chip>Pending</Chip>
 * <Chip variant="outline" onDelete={() => remove(id)}>0x123…abc</Chip>
 * ```
 *
 * @remarks
 * Key Props:
 * - `variant` ('default' | 'outline' | 'primary' | 'warning' | 'success' | 'destructive' | 'info' | 'positive' | 'negative')
 * - `size` ('sm' | 'default' | 'lg' | 'auto') — `default` is content-height (no fixed height)
 * - `shape` ('pill' | 'tag')
 * - `onDelete` (renders a remove button when provided)
 * - `className`
 */
const chipVariants = cva(
  'inline-flex w-fit items-center gap-1 whitespace-nowrap font-medium [&>svg]:size-3 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        // Solid fill: the tinted `bg-primary/10 text-primary` version was indistinguishable
        // from `default` in light mode (10% black on near-black text).
        primary: 'bg-primary text-primary-foreground',
        // Semantic colour tints, kept at parity with Badge's variants.
        warning: 'bg-warning-subtle text-warning-strong',
        success:
          'bg-accent-secondary text-accent-secondary-foreground dark:bg-accent-secondary/20 dark:text-accent-success',
        destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
        info: 'bg-info-subtle text-info-strong',
        positive: 'bg-success-subtle text-success-strong',
        negative: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
      },
      // Geometry lives on `size`/`shape`, never on a call-site className.
      size: {
        sm: 'h-5 px-1.5 py-0 text-[10px] leading-none',
        default: 'px-2.5 py-0.5 text-xs',
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

type ChipProps = ComponentProps<'span'> & VariantProps<typeof chipVariants> & { onDelete?: () => void }

function Chip({ className, variant, size, shape, onDelete, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size, shape, className }))} data-slot="chip" {...props}>
      {children}
      {onDelete && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onDelete}
          className="-mr-1 ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </span>
  )
}

export { Chip, chipVariants }
