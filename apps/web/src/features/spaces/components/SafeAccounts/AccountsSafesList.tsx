import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCardReadOnly from './SafeCardReadOnly'
import SafeCardsErrorBoundary from './SafeCardsErrorBoundary'
import SimilarAddressAlert from '../SelectSafesOnboarding/components/SimilarAddressAlert'

interface SafeListProps {
  safes: AllSafeItems
  similarAddresses: Set<string>
}

const renderSafeCards = (safes: AllSafeItems, similarAddresses: Set<string>) =>
  safes.map((safe, index) => {
    const isSimilar = similarAddresses.has(safe.address.toLowerCase())
    const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
    return (
      <SafeCardsErrorBoundary key={key}>
        <SafeCardReadOnly safe={safe} isSimilar={isSimilar} />
      </SafeCardsErrorBoundary>
    )
  })

const AccountsSafesList = ({ safes, similarAddresses }: SafeListProps) => {
  return (
    <div className="flex w-full flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      {renderSafeCards(safes, similarAddresses)}
    </div>
  )
}

export default AccountsSafesList
