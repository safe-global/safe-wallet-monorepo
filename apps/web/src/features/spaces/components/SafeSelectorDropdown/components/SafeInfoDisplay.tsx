import { blo } from 'blo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { getInitials, getSafeDisplayInfo } from '../utils'
import ThresholdBadge from './ThresholdBadge'
import CopyAddressButton from './CopyAddressButton'

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
  /** When provided, renders a threshold/owners badge on the avatar's bottom-right corner. */
  threshold?: number
  owners?: number
}

const SafeInfoDisplay = ({ name, address, className, threshold, owners }: SafeInfoDisplayProps) => {
  const { displayName } = getSafeDisplayInfo(name, address)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative shrink-0">
        <Avatar size="sm">
          <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        {threshold !== undefined && owners !== undefined && <ThresholdBadge threshold={threshold} owners={owners} />}
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <Typography variant="paragraph-small-medium" className="truncate">
          {displayName}
        </Typography>
        <div className="flex items-center gap-1 min-w-0">
          {/* Center-truncated address with bold ends; hover reveals the full address. */}
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="w-fit min-w-0 cursor-help whitespace-nowrap font-mono text-xs text-muted-foreground" />
              }
            >
              <span className="text-foreground font-semibold">{address.slice(0, 4)}</span>…
              <span className="text-foreground font-semibold">{address.slice(-6)}</span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[min(100vw-2rem,22rem)] font-mono text-[11px] leading-snug break-all"
            >
              <span className="font-bold">{address.slice(0, 4)}</span>
              {address.slice(4, -6)}
              <span className="font-bold">{address.slice(-6)}</span>
            </TooltipContent>
          </Tooltip>
          <CopyAddressButton address={address} testId="safe-item-copy-address" />
        </div>
      </div>
    </div>
  )
}

export default SafeInfoDisplay
