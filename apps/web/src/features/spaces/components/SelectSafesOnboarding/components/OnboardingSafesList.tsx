import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from './SafeCard'
import SimilarAddressAlert from './SimilarAddressAlert'
import css from './OnboardingSafesList.module.css'

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

const SectionHeader = ({ label }: { label: string }) => <p className={css.sectionHeader}>{label}</p>

const OnboardingSafesList = ({ trustedSafes, ownedSafes, similarAddresses }: SafeListProps) => {
  return (
    <div className={css.list}>
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
