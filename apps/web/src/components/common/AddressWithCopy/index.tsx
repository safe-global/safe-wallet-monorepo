import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import CopyAddressIconButton from '../CopyAddressIconButton'

/**
 * Shortened address + inline copy button, laid out consistently for shadcn account rows/cards.
 * When a `similarity` match is passed (address-poisoning Mode B), the matching leading/trailing
 * characters are highlighted in the match's tone — same treatment as ShortAddressWithTooltip.
 */
const AddressWithCopy = ({
  address,
  similarity,
  'data-testid': testId,
}: {
  address: string
  similarity?: SimilarityMatch | null
  'data-testid'?: string
}) => {
  const showHighlight = Boolean(similarity) && address.startsWith('0x') && address.length >= 10
  const isCritical = similarity?.severity === Severity.CRITICAL
  const hlStyle = { color: isCritical ? 'var(--color-error-dark)' : 'var(--color-warning-dark)', fontWeight: 700 }
  const front = (similarity?.prefixLen ?? 0) >= 4
  const back = (similarity?.suffixLen ?? 0) >= 4

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Typography data-testid={testId} variant="paragraph-mini" color="muted" className="truncate">
        {showHighlight ? (
          <>
            0x
            {front ? <b style={hlStyle}>{address.slice(2, 6)}</b> : address.slice(2, 6)}…
            {back ? <b style={hlStyle}>{address.slice(-4)}</b> : address.slice(-4)}
          </>
        ) : (
          shortenAddress(address)
        )}
      </Typography>
      <CopyAddressIconButton address={address} />
    </div>
  )
}

export default AddressWithCopy
