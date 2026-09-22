import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import RowEndColumn from './RowEndColumn'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance?: string | ReactNode
  isLoading?: boolean
  className?: string
}

// Right-aligned fiat balance for a dropdown row. The threshold/owners badge now lives on the avatar
// (see ThresholdBadge); this component intentionally renders the balance only.
const BalanceDisplay = ({ balance, isLoading, className }: BalanceDisplayProps) => (
  <RowEndColumn className={className}>
    {balance !== undefined &&
      (isLoading ? (
        <Skeleton className="h-4 w-14 rounded" />
      ) : (
        <Typography variant="paragraph-small-medium">{balance}</Typography>
      ))}
  </RowEndColumn>
)

export default BalanceDisplay
