import type { ComponentProps, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import css from '../styles.module.css'

/** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
type DeprecatedSx = object

/**
 * The card every transaction step renders its content into.
 *
 * Compose the structural parts rather than hand-rolling them, the same way DialogHeader /
 * DialogFooter are composed: {@link TxCardFooter} for the submit row, {@link TxCardDivider} for a
 * rule between blocks. Both own the bleed through the card's padding, so their rule spans the full
 * card width — call sites never need a negative margin, and a rule cannot end up short of an edge.
 *
 * @example
 * ```tsx
 * <TxCard>
 *   <Typography>You're about to deploy this Safe account.</Typography>
 *   <TxCard.Divider />
 *   …owners and threshold…
 *   <TxCard.Footer>
 *     <Button size="submit">Activate</Button>
 *   </TxCard.Footer>
 * </TxCard>
 * ```
 */
const TxCard = ({ children, sx = {} }: { children: ReactNode; sx?: DeprecatedSx }) => {
  void sx
  return (
    /* radius="xl" (24px) matches TxLayoutBase's header above and the rest of the app's cards —
       Card's own `lg` default left the bottom corners flatter than the top. */
    <Card size="none" radius="xl" className="txCardRoot my-4">
      <CardContent data-testid="card-content" className={css.cardContent}>
        {children}
      </CardContent>
    </Card>
  )
}

/** A rule spanning the full card width, bled out through the card's own inline padding. */
export const TxCardDivider = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="tx-card-divider"
    data-testid="tx-card-divider"
    role="separator"
    className={cn(css.bleed, css.ruled, className)}
    {...props}
  />
)

/** `divided` mirrors DialogHeader / DialogFooter: the rule is the default, `false` opts out. */
type DividedProps = { divided?: boolean }

/**
 * The submit row: a rule, then the step's actions aligned to the trailing edge. Buttons stack
 * full-width below `lg` and sit in a row above it, with the primary action last in the DOM so
 * reversing the column puts it on top.
 */
export const TxCardFooter = ({
  children,
  divided = true,
  className,
  ...props
}: ComponentProps<'div'> & DividedProps) => (
  <div
    data-slot="tx-card-footer"
    /* `txCardFooter` is a plain global hook so TxLayoutBase can reserve room for the Back button
       it centres underneath; everything else about the footer's own look lives here. */
    className={cn('txCardFooter flex justify-end', css.slot, divided && cn(css.ruled, css.footer), className)}
    {...props}
  >
    <div className="flex w-full flex-col-reverse gap-4 lg:w-auto lg:flex-row">{children}</div>
  </div>
)

TxCard.Divider = TxCardDivider
TxCard.Footer = TxCardFooter

export default TxCard
