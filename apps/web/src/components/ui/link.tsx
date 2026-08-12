import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Link Component
 *
 * Anchor primitive aligned with the Safe{Wallet} design system. Replaces MUI's `Link`.
 *
 * @example
 * ```tsx
 * <Link href="https://safe.global">Safe</Link>
 * <Link render={<NextLink href="/settings" />}>Settings</Link>
 * ```
 *
 * @remarks
 * Key Props:
 * - `variant` ('default' | 'muted' | 'inherit')
 * - `render` (polymorphic — e.g. Next.js `Link`)
 * - `className`
 */
const linkVariants = cva(
  'underline-offset-4 transition-colors hover:underline outline-none rounded-xs focus-visible:ring-ring/50 focus-visible:ring-[3px] [&>svg]:inline [&>svg]:size-4',
  {
    variants: {
      variant: {
        // Rest-state underline: in light mode `text-primary` is the body-text color, so
        // without it links have zero affordance (dark mode gets the green for free).
        default: 'text-primary underline decoration-primary/40 hover:decoration-current',
        muted: 'text-muted-foreground hover:text-foreground',
        inherit: 'text-inherit',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Link({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'a'> & VariantProps<typeof linkVariants>) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(linkVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: 'link',
      variant,
    },
  })
}

export { Link, linkVariants }
