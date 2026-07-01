import { useMemo } from 'react'
import { type SafeItem, type AllSafeItems, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import { useListSimilarities } from '@/features/address-poisoning'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import MultiAccountItem from '../AccountItems/MultiAccountItem'
import { SafeListItem } from './SafeListItem'

export type SafeListProps = {
  safes?: AllSafeItems
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const renderSafeItem = (
  item: SafeItem | MultiChainSafeItem,
  similarity: SimilarityMatch | undefined,
  onLinkClick?: SafeListProps['onLinkClick'],
  isSpaceSafe = false,
) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem onLinkClick={onLinkClick} multiSafeAccountItem={item} isSpaceSafe={isSpaceSafe} />
  ) : (
    <SafeListItem safeItem={item} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} similarity={similarity} />
  )
}

const SafesList = ({ safes, onLinkClick, isSpaceSafe = false }: SafeListProps) => {
  // Mode B: flag any listed safe that resembles a trusted anchor (impostor-next-to-real).
  const addresses = useMemo(() => (safes ?? []).map((item) => item.address), [safes])
  const similarities = useListSimilarities(addresses)

  if (!safes || safes.length === 0) {
    return null
  }

  return safes.map((item) => (
    <div key={item.address}>
      {renderSafeItem(item, similarities.get(item.address)?.match, onLinkClick, isSpaceSafe)}
    </div>
  ))
}

export default SafesList
