import { useMemo } from 'react'
import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import { useListSimilarities } from '@/features/address-poisoning'
import SafeCardReadOnly from './SafeCardReadOnly'
import SafeCardsErrorBoundary from './SafeCardsErrorBoundary'

interface SafeListProps {
  safes: AllSafeItems
}

const AccountsSafesList = ({ safes }: SafeListProps) => {
  // Mode B: flag any listed safe that resembles a trusted anchor (impostor-next-to-real).
  const addresses = useMemo(() => safes.map((safe) => safe.address), [safes])
  const similarities = useListSimilarities(addresses)

  return (
    <div className="flex w-full flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {safes.map((safe, index) => {
        const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
        return (
          <SafeCardsErrorBoundary key={key}>
            <SafeCardReadOnly safe={safe} match={similarities.get(safe.address)?.match} />
          </SafeCardsErrorBoundary>
        )
      })}
    </div>
  )
}

export default AccountsSafesList
