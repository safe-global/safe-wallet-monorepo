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
 * - `variant` ('default' | 'outline' | 'primary')
 * - `onDelete` (renders a remove button when provided)
 * - `className`
 */
const chipVariants = cva(
  'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-4xl px-2.5 py-0.5 text-xs font-medium [&>svg]:size-3 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        // Solid fill: the tinted `bg-primary/10 text-primary` version was indistinguishable
        // from `default` in light mode (10% black on near-black text).
        primary: 'bg-primary text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type ChipProps = ComponentProps<'span'> & VariantProps<typeof chipVariants> & { onDelete?: () => void }

function Chip({ className, variant, onDelete, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, className }))} data-slot="chip" {...props}>
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
