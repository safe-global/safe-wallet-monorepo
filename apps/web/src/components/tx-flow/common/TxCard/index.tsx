import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import css from '../styles.module.css'

/** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
type DeprecatedSx = object

const TxCard = ({ children, sx = {} }: { children: ReactNode; sx?: DeprecatedSx }) => {
  void sx
  return (
    // eslint-disable-next-line no-restricted-syntax -- stacked tx-card drops its top border (border-t-0) to butt against the header above; structural, not a variant
    <Card variant="outlined" size="none" className="txCardRoot my-4 border-t-0">
      <CardContent data-testid="card-content" className={css.cardContent}>
        {children}
      </CardContent>
    </Card>
  )
}

export default TxCard

export const TxCardActions = ({ children, sx }: { children: ReactNode; sx?: DeprecatedSx }) => {
  void sx
  return (
    <div className="txCardActions flex items-center">
      <div className="flex w-full flex-col-reverse gap-4 lg:w-auto lg:flex-row">{children}</div>
    </div>
  )
}
