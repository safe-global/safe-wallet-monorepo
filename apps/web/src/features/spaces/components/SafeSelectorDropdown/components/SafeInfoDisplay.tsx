import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { getInitials, getSafeDisplayInfo } from '../utils'

export interface SafeInfoDisplayProps {
  name: string
  address: string
  chainShortName?: string
  className?: string
}

const SafeInfoDisplay = ({ name, address, chainShortName, className }: SafeInfoDisplayProps) => {
  const { addressWithPrefix, displayName, showAddressLine } = getSafeDisplayInfo(name, address, chainShortName)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar size="sm">
        <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <Typography variant="paragraph-small-medium">{displayName}</Typography>
        {showAddressLine && (
          <Typography variant="paragraph-mini" color="muted">
            {addressWithPrefix}
          </Typography>
        )}
      </div>
    </div>
  )
}

export default SafeInfoDisplay
