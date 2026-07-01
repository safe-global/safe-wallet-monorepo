/**
 * Shared shadcn-only primitives used by the AccountsModal safe rows.
 * No MUI dependencies.
 */
import { type CSSProperties, type MouseEvent, useState } from 'react'
import { isAddress } from 'ethers'
import { Eye, Cloud, Copy, Check } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { useChain } from '@/hooks/useChains'
import { Skeleton } from '@/components/ui/skeleton'
import NotActivatedBadgeBase from '@/components/common/NotActivatedBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import type { SafeItem } from '@/hooks/safes'

export const ICON_SIZE = 36

/** Blockie identicon using blo, shadcn Skeleton as fallback */
export function SafeIdenticon({ address, size = ICON_SIZE }: { address: string; size?: number }) {
  if (!isAddress(address)) {
    return <Skeleton className="rounded-full shrink-0" style={{ width: size, height: size }} />
  }

  const { blo } = require('blo') as { blo: (addr: `0x${string}`) => string }

  return (
    <div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${blo(address as `0x${string}`)})`,
        backgroundSize: 'cover',
      }}
    />
  )
}

/** Single chain logo img, no MUI */
export function ChainLogo({ chainId, size = 20 }: { chainId: string; size?: number }) {
  const chain = useChain(chainId)
  if (!chain) return <Skeleton className="rounded-full shrink-0" style={{ width: size, height: size }} />
  if (!chain.chainLogoUri) return null
  return (
    <img
      src={chain.chainLogoUri}
      alt={chain.chainName}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      loading="lazy"
    />
  )
}

/** Stacked overlapping chain logos for multi-chain items */
export function StackedChainLogos({ safes }: { safes: SafeItem[] }) {
  const MAX = 4
  const visible = safes.slice(0, MAX)
  const extra = safes.length - MAX

  return (
    <div className="flex shrink-0 items-center">
      {visible.map((safe) => (
        <ChainLogoStacked key={safe.chainId} chainId={safe.chainId} />
      ))}
      {extra > 0 && (
        <div
          className="-ml-2.5 flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
          style={{ outline: '2px solid hsl(var(--background))' }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

function ChainLogoStacked({ chainId }: { chainId: string }) {
  const chain = useChain(chainId)
  if (!chain?.chainLogoUri) {
    return (
      <div
        className="-ml-2.5 size-5 rounded-full bg-muted first:ml-0"
        style={{ outline: '2px solid hsl(var(--background))' }}
      />
    )
  }
  return (
    <img
      src={chain.chainLogoUri}
      alt={chain.chainName}
      width={20}
      height={20}
      className="-ml-2.5 rounded-full first:ml-0"
      style={{ outline: '2px solid hsl(var(--background))' }}
      loading="lazy"
    />
  )
}

/** Address book source icon with tooltip — matches the existing EthHashInfo icon */
export function NameSourceIcon({ source }: { source: ContactSource }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex shrink-0 items-center" />}>
        {source === ContactSource.local ? (
          <AddressBookIcon className="size-3 text-muted-foreground stroke-[2.5]" />
        ) : (
          <Cloud className="size-3 text-muted-foreground stroke-[2.5]" />
        )}
      </TooltipTrigger>
      <TooltipContent>From your {source === ContactSource.space ? 'workspace' : 'local'} address book</TooltipContent>
    </Tooltip>
  )
}

/** Full `0x` address in tooltip — bold first 4 hex chars (after prefix) and last 4 chars */
const TooltipFullAddress = ({ address }: { address: string }) => {
  if (!address.startsWith('0x') || address.length < 10) {
    return address
  }
  return (
    <>
      {address.slice(0, 2)}
      <strong className="font-bold">{address.slice(2, 6)}</strong>
      {address.slice(6, -4)}
      <strong className="font-bold">{address.slice(-4)}</strong>
    </>
  )
}

/**
 * Shortened address; hover shows full address in a tooltip.
 *
 * When `similarity` is set (Mode B anchor match), the matching visible end(s) —
 * the first 4 hex when the front matches and/or the last 4 when the back matches —
 * are highlighted in the match's tone (red for CRITICAL, amber for WARN) so a
 * look-alike can't hide in the list at a glance. Mirrors EthHashInfo's Mode B highlight.
 */
export function ShortAddressWithTooltip({
  address,
  className,
  similarity,
}: {
  address: string
  className?: string
  similarity?: SimilarityMatch | null
}) {
  const showHighlight = Boolean(similarity) && address.startsWith('0x') && address.length >= 10
  const isCritical = similarity?.severity === Severity.CRITICAL
  const hlStyle: CSSProperties = {
    color: isCritical ? 'var(--color-error-dark)' : 'var(--color-warning-dark)',
    fontWeight: 700,
  }
  const front = (similarity?.prefixLen ?? 0) >= 4
  const back = (similarity?.suffixLen ?? 0) >= 4

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn('w-fit max-w-full min-w-0 cursor-help truncate text-xs text-muted-foreground', className)}
          />
        }
      >
        {showHighlight ? (
          <>
            0x
            {front ? <b style={hlStyle}>{address.slice(2, 6)}</b> : address.slice(2, 6)}
            ...
            {back ? <b style={hlStyle}>{address.slice(-4)}</b> : address.slice(-4)}
          </>
        ) : (
          shortenAddress(address)
        )}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[min(100vw-2rem,22rem)] text-left font-mono text-[11px] leading-snug break-all"
      >
        <TooltipFullAddress address={address} />
      </TooltipContent>
    </Tooltip>
  )
}

/** Copy address button — click to copy, shows check icon for 2s */
export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer"
      aria-label={copied ? 'Copied' : 'Copy address'}
    >
      {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  )
}

/** Skeleton row mimicking a safe card — used while data is loading */
export function SafeItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-3 mb-1">
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="size-5 rounded-full shrink-0" />
      <Skeleton className="h-3.5 w-14 ml-auto" />
    </div>
  )
}

/** Loading skeleton showing multiple safe card placeholders */
export function SafeListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SafeItemSkeleton key={i} />
      ))}
    </>
  )
}

/** Read-only badge — outlined pill with eye icon */
export function ReadOnlyBadge() {
  return (
    <span
      className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border border-border px-1.5 py-px text-[11px] leading-none text-muted-foreground"
      data-testid="read-only-chip"
    >
      <Eye className="size-3 shrink-0" />
      Read-only
    </span>
  )
}

/** Not activated / activating badge */
export function NotActivatedBadge({ isActivating }: { isActivating: boolean }) {
  return <NotActivatedBadgeBase isActivating={isActivating} data-testid="pending-activation-icon" />
}
