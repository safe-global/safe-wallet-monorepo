import { useMemo } from 'react'
import { type SafeItem, type AllSafeItems, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import {
  useSelectionSimilarities,
  useSimilarityGroups,
  SimilarityGroupContainer,
  type SelectionSimilarity,
} from '@/features/address-poisoning'
import MultiAccountItem from '../AccountItems/MultiAccountItem'
import { SafeListItem } from './SafeListItem'

export type SafeListProps = {
  safes?: AllSafeItems
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const renderSafeItem = (
  item: SafeItem | MultiChainSafeItem,
  similarity: SelectionSimilarity | undefined,
  onLinkClick?: SafeListProps['onLinkClick'],
  isSpaceSafe = false,
) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem
      onLinkClick={onLinkClick}
      multiSafeAccountItem={item}
      isSpaceSafe={isSpaceSafe}
      similarity={similarity}
    />
  ) : (
    <SafeListItem safeItem={item} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} similarity={similarity} />
  )
}

const SafesList = ({ safes, onLinkClick, isSpaceSafe = false }: SafeListProps) => {
  // Mode B: flag safes that resemble a trusted anchor OR another listed safe, and frame the look-alikes
  // together in a "verify carefully" box.
  const addresses = useMemo(() => (safes ?? []).map((item) => item.address), [safes])
  const similarities = useSelectionSimilarities(addresses, { flagAnchors: true })
  const { groups, ungrouped } = useSimilarityGroups(addresses)

  const byAddress = useMemo(() => {
    const map = new Map<string, SafeItem | MultiChainSafeItem>()
    for (const item of safes ?? []) map.set(item.address.toLowerCase(), item)
    return map
  }, [safes])

  if (!safes || safes.length === 0) {
    return null
  }

  return (
    <>
      {groups.map((group) => (
        <SimilarityGroupContainer key={group.key} critical={group.isCritical}>
          {group.addresses.map((address) => {
            const item = byAddress.get(address.toLowerCase())
            return item ? (
              <div key={item.address}>
                {renderSafeItem(item, similarities.get(item.address), onLinkClick, isSpaceSafe)}
              </div>
            ) : null
          })}
        </SimilarityGroupContainer>
      ))}
      {ungrouped.map((address) => {
        const item = byAddress.get(address.toLowerCase())
        return item ? (
          <div key={item.address}>{renderSafeItem(item, similarities.get(item.address), onLinkClick, isSpaceSafe)}</div>
        ) : null
      })}
    </>
  )
}

export default SafesList
