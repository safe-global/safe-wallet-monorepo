import { cn } from '@/utils/cn'

/**
 * Aspect Ratio Component
 *
 * Displays content within a desired ratio.
 *
 * @see https://ui.shadcn.com/docs/components/base/aspect-ratio
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="..." alt="..." />
 * </AspectRatio>
 * ```
 *
 * @remarks
 * Key Props:
 * - `ratio` (number, required)
 * - `className`
 */

function AspectRatio({ ratio, className, ...props }: React.ComponentProps<'div'> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          '--ratio': ratio,
        } as React.CSSProperties
      }
      className={cn('relative aspect-(--ratio)', className)}
      {...props}
    />
  )
}

export { AspectRatio }
