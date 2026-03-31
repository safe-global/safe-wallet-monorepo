import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from '@/components/common/SafeList/components/SafeCard'
import SimilarAddressAlert from '@/components/common/SafeList/components/SimilarAddressAlert'

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
  similarAddresses: Set<string>
}

const renderSafeCards = (safes: AllSafeItems, similarAddresses: Set<string>) =>
  safes.map((safe, index) => {
    const isSimilar = similarAddresses.has(safe.address.toLowerCase())
    if (isMultiChainSafeItem(safe)) {
      return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} isSimilar={isSimilar} />
    }
    return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} isSimilar={isSimilar} />
  })

const SectionHeader = ({ label }: { label: string }) => (
  <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
)

const OnboardingSafesList = ({ trustedSafes, ownedSafes, similarAddresses }: SafeListProps) => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      {trustedSafes.length > 0 && (
        <>
          <SectionHeader label="Trusted safes" />
          {renderSafeCards(trustedSafes, similarAddresses)}
        </>
      )}

      {ownedSafes.length > 0 && (
        <>
          <SectionHeader label="Owned safes" />
          {renderSafeCards(ownedSafes, similarAddresses)}
        </>
      )}
    </div>
  )
}

export default OnboardingSafesList
