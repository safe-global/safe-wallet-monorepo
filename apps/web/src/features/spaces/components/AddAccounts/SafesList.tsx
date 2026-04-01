import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import SafeCard from '../SelectSafesOnboarding/components/SafeCard'
import SimilarAddressAlert from '../SelectSafesOnboarding/components/SimilarAddressAlert'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import { useMemo } from 'react'

export const getSafeId = (safeItem: { chainId: string; address: string }) => {
  return `${safeItem.chainId}:${safeItem.address}`
}

const renderSafeCards = (safes: AllSafeItems, similarAddresses: Set<string>) =>
  safes.map((safe, index) => {
    const isSimilar = similarAddresses.has(safe.address.toLowerCase())
    if (isMultiChainSafeItem(safe)) {
      return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} isSimilar={isSimilar} />
    }
    return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} isSimilar={isSimilar} />
  })

const SafesList = ({ safes }: { safes: AllSafeItems }) => {
  // Detect similar addresses
  const similarAddresses = useMemo<Set<string>>(() => {
    const uniqueAddresses = [...new Set(safes.map((s) => s.address))]
    if (uniqueAddresses.length < 2) return new Set()
    const result = detectSimilarAddresses(uniqueAddresses)
    return new Set(uniqueAddresses.filter((addr) => result.isFlagged(addr)).map((a) => a.toLowerCase()))
  }, [safes])

  return (
    <div className="flex w-full flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))] p-4">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      {renderSafeCards(safes, similarAddresses)}
    </div>
  )
}

export default SafesList
