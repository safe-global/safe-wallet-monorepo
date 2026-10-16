import type { ReactElement } from 'react'
import { Check, Copy } from 'lucide-react'
import { HighlightedAddress } from '@safe-global/views/features/safe-shield/components/HighlightedAddress'
import { ExternalLinkIcon } from '@safe-global/views/components/common/ExternalLink/ExternalLinkIcon'
import LinkIcon from '@safe-global/views/assets/images/common/link.svg'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'

const iconButtonClassName = 'inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-background/15'

/**
 * Full address with inline copy (and an optional explorer link) for dark look-alike tooltips. Bare controls,
 * not CopyAddressButton/ExplorerButton — their hover tint and nested Tooltip are both wrong inside a dark tooltip.
 */
const PeerAddress = ({
  address,
  prefixLen = 0,
  suffixLen = 0,
  explorerLink,
}: {
  address: string
  /** Leading hex chars (after `0x`) to bold — the part a look-alike shares. */
  prefixLen?: number
  /** Trailing hex chars to bold. */
  suffixLen?: number
  explorerLink?: { href: string; title: string }
}): ReactElement => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap font-mono text-xs">
        <HighlightedAddress address={address} prefixLen={prefixLen} suffixLen={suffixLen} />
      </span>
      <button type="button" aria-label="Copy address" className={iconButtonClassName} onClick={() => copy(address)}>
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      </button>
      {explorerLink && (
        <a
          href={explorerLink.href}
          target="_blank"
          rel="noreferrer"
          aria-label={explorerLink.title}
          className={iconButtonClassName}
        >
          <ExternalLinkIcon className="size-3" fallback={LinkIcon} />
        </a>
      )}
    </div>
  )
}

export default PeerAddress
