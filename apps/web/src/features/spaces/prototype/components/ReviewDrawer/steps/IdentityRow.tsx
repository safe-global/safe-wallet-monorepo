import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import Identicon from '@/components/common/Identicon'
import { useCopyToClipboard } from '@/components/common/AuditLog'

const EXPLORERS: Record<string, string> = {
  '1': 'https://etherscan.io/address/',
  '8453': 'https://basescan.org/address/',
  '42161': 'https://arbiscan.io/address/',
}

const short = (address: string) => (address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address)

// Same API as SafeAddress in the Policies prototype, so both can move to the library together.
export function IdentityRow({
  name,
  address,
  avatar,
  detail,
  tone,
  chainId = '1',
  avatarSize = 24,
}: {
  name?: string | null
  // Address to show and copy. `avatar` sets the identicon for a short address.
  address?: string
  avatar?: string
  detail?: string
  tone?: 'warning' | 'success'
  chainId?: string
  avatarSize?: number
}) {
  const full = address && !address.includes('…') ? address : undefined
  const [copied, copy] = useCopyToClipboard(full ?? '')
  const secondary = detail ?? (address ? short(address) : undefined)
  const toneClass =
    tone === 'warning' ? 'text-warning-strong' : tone === 'success' ? 'text-success-strong' : 'text-muted-foreground'
  const content = (
    <span className="flex min-w-0 items-center gap-2 text-left">
      <span className="flex shrink-0">
        <Identicon address={avatar ?? full ?? address ?? ''} size={avatarSize} />
      </span>
      <span className="min-w-0">
        {name && <span className="block truncate text-sm">{name}</span>}
        {secondary && (
          <span className={`block truncate text-xs ${toneClass} ${secondary.startsWith('0x') ? 'font-mono' : ''}`}>
            {secondary}
          </span>
        )}
      </span>
    </span>
  )
  if (!full) return content
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="min-w-0" />} onClick={(event) => event.stopPropagation()}>
        {content}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">
        <span className="flex items-center gap-1">
          <span className="break-all font-mono">{full}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? 'Address copied' : 'Copy address'}
            className="shrink-0 text-background hover:bg-background/10 hover:text-background"
            onClick={(event) => {
              event.stopPropagation()
              copy()
            }}
          >
            {copied ? <Check strokeWidth={ICON_STROKE} /> : <Copy strokeWidth={ICON_STROKE} />}
          </Button>
          {EXPLORERS[chainId] && (
            <a
              href={`${EXPLORERS[chainId]}${full}`}
              target="_blank"
              rel="noreferrer"
              aria-label="View on explorer"
              className="flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-background/10"
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="size-3" strokeWidth={ICON_STROKE} />
            </a>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
