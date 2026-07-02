import { useMemo } from 'react'
import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import { useSelectionSimilarities } from '@/features/address-poisoning'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import SafeCardReadOnly from './SafeCardReadOnly'
import SafeCardsErrorBoundary from './SafeCardsErrorBoundary'

interface SafeListProps {
  safes: AllSafeItems
}

const AccountsSafesList = ({ safes }: SafeListProps) => {
  // Mode B: flag any listed safe that resembles a trusted anchor (impostor-next-to-real) OR another
  // safe in this list (two look-alikes). Anchors are flagged too — this is a display surface.
  const addresses = useMemo(() => safes.map((safe) => safe.address), [safes])
  const similarities = useSelectionSimilarities(addresses, { flagAnchors: true })

  const similaritySeverity = useMemo(() => {
    let hasWarn = false
    for (const { match } of similarities.values()) {
      if (match?.severity === Severity.CRITICAL) return 'error' as const
      if (match) hasWarn = true
    }
    return hasWarn ? ('warning' as const) : null
  }, [similarities])

  return (
    <div className="flex w-full flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {similaritySeverity && <SimilarAddressAlert severity={similaritySeverity} />}
      {safes.map((safe, index) => {
        const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
        const similarity = similarities.get(safe.address)
        return (
          <SafeCardsErrorBoundary key={key}>
            <SafeCardReadOnly safe={safe} match={similarity?.match} intraList={similarity?.intraList} />
          </SafeCardsErrorBoundary>
        )
      })}
    </div>
  )
}

export default AccountsSafesList
