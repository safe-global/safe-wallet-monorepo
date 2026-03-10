import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance: string | ReactNode
  threshold: number
  owners: number
  isLoading?: boolean
  showThreshold?: boolean
}

const BalanceDisplay = ({ balance, threshold, owners, isLoading, showThreshold = true }: BalanceDisplayProps) => (
  <div className="flex flex-col items-end gap-2 min-w-0 shrink sm:w-[100px] sm:shrink-0">
    {isLoading ? (
      <Skeleton className="h-3.5 w-14 rounded" />
    ) : (
      <Typography variant="paragraph-mini-medium" color="muted">
        {balance}
      </Typography>
    )}
    {showThreshold &&
      (isLoading ? (
        <Skeleton className="h-5 w-12 rounded-full" />
      ) : (
        <Badge variant="secondary" className="gap-1">
          <User className="size-3" />
          {threshold}/{owners}
        </Badge>
      ))}
  </div>
)

export default BalanceDisplay
