import { type AllSafeItems, flattenSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import SafeCard from './SafeCard'

interface SafeListProps {
  safes: AllSafeItems
}

const OnboardingSafesList = ({ safes }: SafeListProps) => {
  const { allSafes: spaceSafes } = useSpaceSafes()
  const flatSafeItems = flattenSafeItems(spaceSafes)
  const multiChainSpaceSafes = spaceSafes.filter(isMultiChainSafeItem)

  return (
    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
      {safes.map((safe, index) => {
        if (isMultiChainSafeItem(safe)) {
          const alreadyAdded = multiChainSpaceSafes.some((spaceSafe) =>
            safe.safes.every((s) => spaceSafe.safes.some((ss) => ss.chainId === s.chainId && ss.address === s.address)),
          )
          return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} alreadyAdded={alreadyAdded} />
        }

        const alreadyAdded = flatSafeItems.some(
          (spaceSafe) => spaceSafe.address === safe.address && spaceSafe.chainId === safe.chainId,
        )
        return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} alreadyAdded={alreadyAdded} />
      })}
    </div>
  )
}

export default OnboardingSafesList
