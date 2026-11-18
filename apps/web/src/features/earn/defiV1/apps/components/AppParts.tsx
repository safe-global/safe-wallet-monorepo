import type { MouseEvent } from 'react'
import { Orbit, Pin, Repeat2, Sprout, type LucideIcon } from 'lucide-react'
import SafeAppIconCard from '@safe-global/views/components/safe-apps/SafeAppIconCard'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import type { AppRow, BuiltIn } from '../catalogue'
import { APPS_V1_COPY } from '../copy'

const BUILT_IN_ICONS: Record<BuiltIn, LucideIcon> = { treasury: Sprout, swap: Repeat2, bridge: Orbit }
const MAX_LOGOS = 4

export const AppIcon = ({ row, size = 32 }: { row: AppRow; size?: number }) => {
  if (!row.builtIn) return <SafeAppIconCard src={row.app?.iconUrl} alt="" width={size} height={size} />
  const Icon = BUILT_IN_ICONS[row.builtIn]
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md bg-success-tint text-badge-dot-success"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  )
}

export const AppBadge = ({ row }: { row: AppRow }) =>
  row.badge ? (
    <Badge variant={row.badge === 'built-in' ? 'brand' : 'subtle'}>{APPS_V1_COPY.badges[row.badge]}</Badge>
  ) : null

export const NetworkLogos = ({ chainIds, chainName }: { chainIds: string[]; chainName: (id: string) => string }) => {
  const extra = chainIds.length - MAX_LOGOS
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="flex w-fit shrink-0 items-center gap-1.5" />}>
        <span className="flex -space-x-1">
          {chainIds.slice(0, MAX_LOGOS).map((chainId) => (
            <Avatar key={chainId} size="xs" className="size-4 ring-2 ring-card">
              <AvatarImage
                src={`https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`}
                alt=""
              />
              <AvatarFallback className="text-[9px]">{chainName(chainId)[0]}</AvatarFallback>
            </Avatar>
          ))}
        </span>
        {extra > 0 && <span className="text-xs text-muted-foreground">+{extra}</span>}
      </TooltipTrigger>
      <TooltipContent>{chainIds.map(chainName).join(', ')}</TooltipContent>
    </Tooltip>
  )
}

export const PinButton = ({ row, pinned, onToggle }: { row: AppRow; pinned: boolean; onToggle: () => void }) => (
  <span
    className={cn(
      'flex transition-opacity',
      !pinned && 'opacity-0 group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100',
    )}
  >
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={pinned ? APPS_V1_COPY.unpin(row.name) : APPS_V1_COPY.pin(row.name)}
      aria-pressed={pinned}
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        onToggle()
      }}
    >
      <Pin className={cn(pinned && 'fill-current')} />
    </Button>
  </span>
)
