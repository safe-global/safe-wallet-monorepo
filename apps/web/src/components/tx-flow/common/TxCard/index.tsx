import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import css from '../styles.module.css'

/** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
type DeprecatedSx = object

const TxCard = ({ children, sx = {} }: { children: ReactNode; sx?: DeprecatedSx }) => {
  void sx
  return (
    <Card size="none" className="txCardRoot my-4">
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
    <div className={cn('txCardActions flex items-center', className)}>
      <div className="flex w-full flex-col-reverse gap-4 lg:w-auto lg:flex-row">{children}</div>
    </div>
  )
}
