import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import RowEndColumn from './RowEndColumn'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance?: string | ReactNode
  isLoading?: boolean
}

// Right-aligned fiat balance for a dropdown row. The threshold/owners badge now lives on the avatar
// (see ThresholdBadge); this component intentionally renders the balance only.
const BalanceDisplay = ({ balance, isLoading }: BalanceDisplayProps) => (
  <RowEndColumn>
    {balance !== undefined &&
      (isLoading ? (
        <Skeleton className="h-4 w-14 rounded" />
      ) : (
        <Typography variant="paragraph-mini-medium" color="muted">
          {balance}
        </Typography>
      ))}
  </RowEndColumn>
)

export default BalanceDisplay
