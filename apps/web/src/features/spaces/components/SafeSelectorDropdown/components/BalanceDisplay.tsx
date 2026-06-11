import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance?: string | ReactNode
  isLoading?: boolean
}

// Right-aligned fiat balance for a dropdown row. The threshold/owners badge now lives on the avatar
// (see ThresholdBadge); this component intentionally renders the balance only.
const BalanceDisplay = ({ balance, isLoading }: BalanceDisplayProps) => (
  <div className="flex flex-col items-end min-w-0 shrink sm:w-[100px] sm:shrink-0">
    {balance !== undefined &&
      (isLoading ? (
        <Skeleton className="h-4 w-14 rounded" />
      ) : (
        <Typography variant="paragraph-mini-medium" color="muted">
          {balance}
        </Typography>
      ))}
  </div>
)

export default BalanceDisplay
