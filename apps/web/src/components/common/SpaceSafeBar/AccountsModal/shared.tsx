/**
 * Shared shadcn-only primitives used by PinnedSafeItem and PinnedMultiSafeItem.
 * No MUI dependencies.
 */
import { isAddress } from 'ethers'
import { Eye, AlertCircle, Cloud } from 'lucide-react'
import { useChain } from '@/hooks/useChains'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import type { SafeItem } from '@/hooks/safes'

export const ICON_SIZE = 36

/** Blockie identicon using blo, shadcn Skeleton as fallback */
export function SafeIdenticon({ address, size = ICON_SIZE }: { address: string; size?: number }) {
  if (!isAddress(address)) {
    return <Skeleton className="rounded-full shrink-0" style={{ width: size, height: size }} />
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
          <AddressBookIcon className="size-3 text-border" />
        ) : (
          <Cloud className="size-3 text-border" />
        )}
      </TooltipTrigger>
      <TooltipContent>From your {source} address book</TooltipContent>
    </Tooltip>
  )
}

/** Read-only badge — outlined pill with eye icon */
export function ReadOnlyBadge() {
  return (
    <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border border-border px-1.5 py-px text-[11px] leading-none text-muted-foreground">
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
    >
      <AlertCircle className="size-3 shrink-0" />
      {isActivating ? 'Activating account' : 'Not activated'}
    </span>
  )
}
