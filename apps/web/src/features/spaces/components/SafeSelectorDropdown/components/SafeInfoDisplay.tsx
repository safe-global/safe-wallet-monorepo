import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/utils/cn'
import { getInitials } from '../utils'

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
}

const SafeInfoDisplay = ({ name, address, className }: SafeInfoDisplayProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <Avatar size="sm">
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">{address}</span>
    </div>
  </div>
)

export default SafeInfoDisplay
