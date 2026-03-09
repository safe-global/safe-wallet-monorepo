import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from './SafeCard'

interface SafeListProps {
  safes: AllSafeItems
}

const OnboardingSafesList = ({ safes }: SafeListProps) => {
  return (
    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
      {safes.map((safe, index) => {
        if (isMultiChainSafeItem(safe)) {
          return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} />
        }

        return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} />
      })}
    </div>
  )
}

export default OnboardingSafesList
