import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import css from '../styles.module.css'

/** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
type DeprecatedSx = object

const TxCard = ({ children, sx = {} }: { children: ReactNode; sx?: DeprecatedSx }) => {
  void sx
  return (
    <Card className="txCardRoot my-4 rounded-b-xl border border-t-0 border-border bg-card py-0 shadow-none">
      <CardContent data-testid="card-content" className={cn('px-0', css.cardContent)}>
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
