import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import css from '../AccountItems/styles.module.css'
import { cn } from '@/utils/cn'

export type AccountItemBalanceViewProps = {
  fiatValue?: ReactNode
  isLoading?: boolean
  balanceClassName?: string
  testId?: string
}

export const AccountItemBalanceView = ({
  fiatValue,
  isLoading,
  balanceClassName,
  testId,
}: AccountItemBalanceViewProps) => {
  return (
    <div className={cn(css.accountItemBalance, balanceClassName)} data-testid={testId}>
      {fiatValue !== undefined ? (
        <Typography variant="paragraph-small-bold">{fiatValue}</Typography>
      ) : isLoading ? (
        <Skeleton className="h-4 w-[60px]" />
      ) : null}
    </div>
  )
}
