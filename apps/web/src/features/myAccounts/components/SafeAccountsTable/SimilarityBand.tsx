import type { ReactElement } from 'react'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import type { SimilarWarning } from '@/features/address-poisoning'
import {
  PeerAddressView,
  SimilarityBandHeaderView,
  SimilarityWarningIconView,
} from '@views/features/myAccounts/components/SafeAccountsTable/SimilarityBandView'

const PeerAddress = ({ address }: { address: string }) => {
  const { copied, copy } = useCopyToClipboard()

  return <PeerAddressView address={address} copied={copied} onCopy={() => copy(address)} />
}

/** Inline ⚠️ after a name, listing cross-list look-alike peers in its tooltip (same-list = band only). */
export const SimilarityWarningIcon = ({ warning }: { warning: SimilarWarning }) => {
  return (
    <SimilarityWarningIconView
      warning={warning}
      renderPeerAddress={(address) => <PeerAddress key={address} address={address} />}
    />
  )
}

/**
 * Band header for the row at `index`, or null unless it starts a new contiguous cluster run.
 * Shared by both table bodies so the "open a band once per run" rule lives once.
 */
export const bandHeaderAt = (
  index: number,
  clusterIdAt: (index: number) => string | undefined,
  colSpan: number,
): ReactElement | null => {
  const clusterId = clusterIdAt(index)
  if (!clusterId) return null
  const previous = index > 0 ? clusterIdAt(index - 1) : undefined
  return clusterId === previous ? null : <SimilarityBandHeaderView key={`band-${clusterId}`} colSpan={colSpan} />
}
