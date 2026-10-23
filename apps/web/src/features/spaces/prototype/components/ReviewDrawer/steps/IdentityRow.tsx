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
  inline = false,
  align = 'end',
  network,
}: {
  name?: string | null
  // Address to show and copy. `avatar` sets the identicon for a short address.
  address?: string
  avatar?: string
  detail?: string
  tone?: 'warning' | 'success'
  chainId?: string
  avatarSize?: number
  // One line, right-aligned: avatar, name, then the short address. Used for label → value rows.
  inline?: boolean
  // Inline only: 'start' when the label sits above the row.
  align?: 'start' | 'end'
  // Inline only: a chain badge on the avatar.
  network?: { name: string; logo: string }
}) {
  const full = address && !address.includes('…') ? address : undefined
  const [copied, copy] = useCopyToClipboard(full ?? '')
  const secondary = detail ?? (address ? short(address) : undefined)
  const toneClass =
    tone === 'warning' ? 'text-warning-strong' : tone === 'success' ? 'text-success-strong' : 'text-muted-foreground'
  const secondaryClass = `truncate text-xs ${toneClass} ${secondary?.startsWith('0x') ? 'font-mono' : ''}`
  const content = inline ? (
    <span className={`flex min-w-0 items-center gap-2 ${align === 'end' ? 'justify-end' : 'justify-start'}`}>
      <span className="relative flex shrink-0">
        <Identicon address={avatar ?? full ?? address ?? ''} size={20} />
        {network && (
          <img
            src={network.logo}
            alt=""
            className="absolute -right-1 -bottom-1 size-3 rounded-full ring-[1.5px] ring-card"
          />
        )}
      </span>
      {name && <span className="min-w-0 truncate text-sm">{name}</span>}
      {secondary && <span className={`shrink-0 ${secondaryClass}`}>{secondary}</span>}
    </span>
  ) : (
    <span className="flex min-w-0 items-center gap-2 text-left">
      <span className="flex shrink-0">
        <Identicon address={avatar ?? full ?? address ?? ''} size={avatarSize} />
      </span>
      <span className="min-w-0">
        {name && <span className="block truncate text-sm">{name}</span>}
        {secondary && <span className={`block ${secondaryClass}`}>{secondary}</span>}
      </span>
    </span>
  )
  if (!full) return content
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={<span className={inline ? `flex min-w-0 ${align === 'end' ? 'justify-end' : ''}` : 'min-w-0'} />}
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">
        {network && <span className="block">{name ? `${name} on ${network.name}` : network.name}</span>}
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

export function AddressActions({ address, chainId = '1' }: { address: string; chainId?: string }) {
  const [copied, copy] = useCopyToClipboard(address)
  return (
    <span className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={copied ? 'Address copied' : 'Copy address'}
        className="text-muted-foreground"
        onClick={copy}
      >
        {copied ? <Check strokeWidth={ICON_STROKE} /> : <Copy strokeWidth={ICON_STROKE} />}
      </Button>
      {EXPLORERS[chainId] && (
        <a
          href={`${EXPLORERS[chainId]}${address}`}
          target="_blank"
          rel="noreferrer"
          aria-label="View on explorer"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3" strokeWidth={ICON_STROKE} />
        </a>
      )}
    </span>
  )
}
