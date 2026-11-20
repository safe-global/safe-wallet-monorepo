import type { ReactElement } from 'react'
import { Check, Copy } from 'lucide-react'
import { HighlightedAddress } from '@safe-global/views/features/safe-shield/components/HighlightedAddress'
import { ExternalLinkIcon } from '@safe-global/views/components/common/ExternalLink/ExternalLinkIcon'
import LinkIcon from '@safe-global/views/assets/images/common/link.svg'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'

const iconButtonClassName = 'inline-flex shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-background/15'

// Bare controls: CopyAddressButton/ExplorerButton's hover tint and nested Tooltip break inside a dark tooltip.
const PeerAddress = ({
  address,
  prefixLen = 0,
  suffixLen = 0,
  explorerLink,
}: {
  address: string
  /** Hex chars after `0x` to bold. */
  prefixLen?: number
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
        {copied ? <Check className="size-3 text-success-strong" /> : <Copy className="size-3" />}
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
