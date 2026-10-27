/**
 * Identity primitives the policy wizards render Safes and addresses with.
 *
 * These lived in `components/common/SpaceSafeBar/AccountsModal/shared` until the workspace
 * navigation rewrite (WA-2811) removed that module. The surviving replacements are shaped for
 * the account dropdown — `SafeIdentity` renders an avatar/name/address triple as flex siblings —
 * so the wizards, which place a bare blockie or a lone address inside their own layouts, keep
 * their own primitives here.
 */
import { type MouseEvent, useState } from 'react'
import { blo } from 'blo'
import { isAddress } from 'ethers'
import { Check, Copy } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useChain } from '@/hooks/useChains'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'

export const ICON_SIZE = 36

/** Blockie identicon, with a skeleton while the address is still unresolved. */
export function SafeIdenticon({ address, size = ICON_SIZE }: { address: string; size?: number }) {
  if (!isAddress(address)) {
    return <Skeleton className="shrink-0 rounded-full" style={{ width: size, height: size }} />
  }

  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${blo(address as `0x${string}`)})`,
        backgroundSize: 'cover',
      }}
    />
  )
}

/** A chain's logo. Renders nothing when the chain config carries no logo. */
export function ChainLogo({ chainId, size = 20 }: { chainId: string; size?: number }) {
  const chain = useChain(chainId)

  if (!chain) return <Skeleton className="shrink-0 rounded-full" style={{ width: size, height: size }} />
  if (!chain.chainLogoUri) return null

  return (
    <img
      src={chain.chainLogoUri}
      alt={chain.chainName}
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      loading="lazy"
    />
  )
}

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
 * Shortened address; hover shows the full address.
 *
 * `isSimilar` bolds the two visible hex groups so a reader can compare one address against a
 * look-alike at a glance.
 */
export function ShortAddressWithTooltip({
  address,
  className,
  isSimilar = false,
}: {
  address: string
  className?: string
  isSimilar?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn('w-fit max-w-full min-w-0 cursor-help truncate text-xs text-muted-foreground', className)}
          />
        }
      >
        {isSimilar && address.startsWith('0x') && address.length >= 10 ? (
          <>
            0x
            <b className="text-foreground">{address.slice(2, 6)}</b>
            ...
            <b className="text-foreground">{address.slice(-4)}</b>
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

/** Copies the address, confirming with a check for two seconds. */
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
      className="shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-muted"
      aria-label={copied ? 'Copied' : 'Copy address'}
    >
      {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  )
}
