import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'

export interface BalanceDisplayProps {
  balance: string | ReactNode
  threshold: number
  owners: number
  isLoading?: boolean
  showThreshold?: boolean
}

const BalanceDisplay = ({ balance, threshold, owners, isLoading, showThreshold = true }: BalanceDisplayProps) => (
  <div className="flex flex-col items-end gap-2 w-[100px] shrink-0">
    {isLoading ? (
      <span className="text-xs font-medium text-muted-foreground">--</span>
    ) : (
      <span className="text-xs font-medium text-muted-foreground">{balance}</span>
    )}
    {showThreshold && (
      <Badge variant="secondary" className="gap-1">
        <User className="size-3" />
        {threshold}/{owners}
      </Badge>
    )}
  </div>
)

export default BalanceDisplay
