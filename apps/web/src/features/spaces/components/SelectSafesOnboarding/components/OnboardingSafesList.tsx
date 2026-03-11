import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from './SafeCard'

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
}

const renderSafeCards = (safes: AllSafeItems) =>
  safes.map((safe, index) => {
    if (isMultiChainSafeItem(safe)) {
      return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} />
    }
    return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} />
  })

const SectionHeader = ({ label }: { label: string }) => (
  <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
)

const OnboardingSafesList = ({ trustedSafes, ownedSafes }: SafeListProps) => {
  return (
    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
      {trustedSafes.length > 0 && (
        <>
          <SectionHeader label="Trusted safes" />
          {renderSafeCards(trustedSafes)}
        </>
      )}

      {ownedSafes.length > 0 && (
        <>
          <SectionHeader label="Owned safes" />
          {renderSafeCards(ownedSafes)}
        </>
      )}
    </div>
  )
}

export default OnboardingSafesList
