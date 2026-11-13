import { type ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@safe-global/views/utils/cn'

/**
 * Tag Component
 *
 * A label for things people or the app categorise, such as address book entries or transaction types.
 * A rectangle with no dot, so it never reads as a status. Status is `Badge` (pill + dot).
 * Never green, yellow, red or mint: those colours mean status.
 *
 * Figma: Mint Refresh colour system, Tag (node 5-118).
 *
 * @example
 * ```tsx
 * <Tag>Vendor</Tag>
 * <Tag color="cobalt"><ArrowUpRight /> Send</Tag>
 * ```
 *
 * @remarks
 * Key Props:
 * - `color` ('default' | 'slate' | 'clay' | 'rose' | 'orchid' | 'lilac' | 'iris' | 'cobalt' | 'sky' | 'lagoon')
 * - `className` (layout only)
 *
 * The colours are the `tag` palette in @safe-global/theme.
 */
const tagVariants = cva(
  'inline-flex h-6 w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-[6px] px-2 text-[13px] leading-5 font-medium [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:pointer-events-none',
  {
    variants: {
      color: {
        default: 'bg-tag-default text-tag-default-foreground',
        slate: 'bg-tag-slate text-tag-slate-foreground',
        clay: 'bg-tag-clay text-tag-clay-foreground',
        rose: 'bg-tag-rose text-tag-rose-foreground',
        orchid: 'bg-tag-orchid text-tag-orchid-foreground',
        lilac: 'bg-tag-lilac text-tag-lilac-foreground',
        iris: 'bg-tag-iris text-tag-iris-foreground',
        cobalt: 'bg-tag-cobalt text-tag-cobalt-foreground',
        sky: 'bg-tag-sky text-tag-sky-foreground',
        lagoon: 'bg-tag-lagoon text-tag-lagoon-foreground',
      },
    },
    defaultVariants: { color: 'default' },
  },
)

type TagProps = Omit<ComponentProps<'span'>, 'color'> & VariantProps<typeof tagVariants>

function Tag({ className, color, ...props }: TagProps) {
  return (
    <span
      data-slot="tag"
      data-color={color ?? 'default'}
      className={cn(tagVariants({ color }), className)}
      {...props}
    />
  )
}

export { Tag, tagVariants }
