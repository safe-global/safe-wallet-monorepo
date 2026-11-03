import { type SafeItem, type MultiChainSafeItem } from '@safe-global/views/hooks/safes/types'
import { type AllSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import { isMultiChainSafeItem } from '@/hooks/safes/isMultiChainSafeItem'
import MultiAccountItem from '../AccountItems/MultiAccountItem'
import { SafeListItem } from './SafeListItem'

export type SafeListProps = {
  safes?: AllSafeItems
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const renderSafeItem = (
  item: SafeItem | MultiChainSafeItem,
  onLinkClick?: SafeListProps['onLinkClick'],
  isSpaceSafe = false,
) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem onLinkClick={onLinkClick} multiSafeAccountItem={item} isSpaceSafe={isSpaceSafe} />
  ) : (
    <SafeListItem safeItem={item} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} />
  )
}

const SafesList = ({ safes, onLinkClick, isSpaceSafe = false }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return safes.map((item) => <div key={item.address}>{renderSafeItem(item, onLinkClick, isSpaceSafe)}</div>)
}

export default SafesList
