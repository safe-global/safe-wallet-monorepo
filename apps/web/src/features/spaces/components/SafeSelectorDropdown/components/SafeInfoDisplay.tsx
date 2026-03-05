import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import { getInitials } from '../utils'

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
}

const SafeInfoDisplay = ({ name, address, className }: SafeInfoDisplayProps) => {
  const displayName = name || shortenAddress(address)
  const showAddressLine = Boolean(name)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar size="sm">
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{displayName}</span>
        {showAddressLine && (
          <span className="text-xs text-muted-foreground">{shortenAddress(address)}</span>
        )}
      </div>
    </div>
  )
}

export default SafeInfoDisplay
