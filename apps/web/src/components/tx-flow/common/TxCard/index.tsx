import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import css from '../styles.module.css'

/** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
type DeprecatedSx = object

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

export default TxCard

export const TxCardActions = ({
  children,
  className,
  sx,
}: {
  children: ReactNode
  className?: string
  sx?: DeprecatedSx
}) => {
  void sx
  return (
    /* justify-end so the primary action is right-aligned on its own, per WA-3234, and not only
       when TxLayoutBase's `.step` happens to be an ancestor. Inside `.step` the module flips this
       row to a column and right-aligns the child with `align-self`, so justify-end is inert there.
       The inner row never goes full width: TxLayoutBase places its Back button at the left of this
       same row, and a full-width action would cover it. */
    <div className={cn('txCardActions flex items-center justify-end', className)}>
      <div className="flex flex-row items-center gap-4">{children}</div>
    </div>
  )
}
