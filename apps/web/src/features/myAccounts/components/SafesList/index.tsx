import { type SafeItem, type AllSafeItems, type MultiChainSafeItem, isMultiChainSafeItem } from '@/hooks/safes'
import MultiAccountItem from '../AccountItems/MultiAccountItem'
import { SafeListItem } from './SafeListItem'
import { SafesListView } from '@views/features/myAccounts/components/SafesList/SafesListView'

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

  return (
    <SafesListView
      items={safes.map((item) => ({ key: item.address, content: renderSafeItem(item, onLinkClick, isSpaceSafe) }))}
    />
  )
}

export default SafesList
