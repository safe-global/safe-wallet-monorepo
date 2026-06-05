/**
 * Shared shadcn-only primitives used by PinnedSafeItem and PinnedMultiSafeItem.
 * No MUI dependencies.
 */
import { type MouseEvent, useState } from 'react'
import { isAddress } from 'ethers'
import { Eye, AlertCircle, Cloud, Copy, Check, TriangleAlert } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useChain } from '@/hooks/useChains'
import { Skeleton } from '@/components/ui/skeleton'
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
      <TooltipContent>From your {source} address book</TooltipContent>
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

/** Shortened address; hover shows full address in a tooltip */
export function ShortAddressWithTooltip({ address, className }: { address: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn('w-fit max-w-full min-w-0 cursor-help truncate text-xs text-muted-foreground', className)}
          />
        }
      >
        {shortenAddress(address)}
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
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-3 mb-2">
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
  return (
    <span
      className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-px text-[11px] leading-none"
      style={{
        backgroundColor: isActivating ? 'var(--color-info-light)' : 'var(--color-warning-background)',
        color: isActivating ? 'var(--color-info-dark)' : 'var(--color-warning-main)',
      }}
      data-testid="pending-activation-icon"
    >
      <AlertCircle className="size-3 shrink-0" />
      {isActivating ? 'Activating' : 'Not activated'}
    </span>
  )
}

/** "High similarity" warning badge */
export function SimilarityBadge() {
  return (
    <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[11px] leading-none text-amber-700">
      <TriangleAlert className="size-3 shrink-0" />
      High similarity
    </span>
  )
}
