import { isMultiChainSafeItem, type MultiChainSafeItem, type SafeItem } from '@/hooks/safes'
import type { SelectionSimilarity } from '@/features/address-poisoning'
import SingleAccountItem from './SingleAccountItem'
import MultiAccountItem from './MultiAccountItem'

type AccountItemProps = {
  safe: SafeItem | MultiChainSafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
  similarity?: SelectionSimilarity
}

const AccountItem = ({ safe, onLinkClick, isSpaceSafe = false, similarity }: AccountItemProps) => {
  if (isMultiChainSafeItem(safe)) {
    return (
      <MultiAccountItem
        multiSafeAccountItem={safe}
        onLinkClick={onLinkClick}
        isSpaceSafe={isSpaceSafe}
        similarity={similarity}
      />
    )
  }
  return (
    <SingleAccountItem safeItem={safe} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} similarity={similarity} />
  )
}

export default AccountItem
