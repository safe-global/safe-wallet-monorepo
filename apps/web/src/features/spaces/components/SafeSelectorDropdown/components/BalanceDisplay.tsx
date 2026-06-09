import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance?: string | ReactNode
  threshold: number
  owners: number
  isLoading?: boolean
  showThreshold?: boolean
}

const BalanceDisplay = ({ balance, threshold, owners, isLoading, showThreshold = true }: BalanceDisplayProps) => {
  // A deployed safe always has threshold/owners >= 1, so 0/0 means the overview hasn't loaded yet
  // (e.g. while switching safes); show a skeleton instead of a misleading "0/0".
  const thresholdLoading = isLoading || (threshold === 0 && owners === 0)

  return (
    <div className="flex flex-col items-end min-w-0 shrink sm:w-[100px] sm:shrink-0">
      {balance !== undefined &&
        (isLoading ? (
          <Skeleton className="h-4 w-14 rounded" />
        ) : (
          <Typography variant="paragraph-mini-medium" color="muted">
            {balance}
          </Typography>
        ))}
      {showThreshold &&
        (thresholdLoading ? (
          <Skeleton className="h-4 w-14 rounded" />
        ) : (
          <Badge data-testid="safe-selector-threshold" variant="secondary" className="gap-1">
            <User className="size-3" />
            {threshold}/{owners}
          </Badge>
        ))}
    </div>
  )
}

export default BalanceDisplay
