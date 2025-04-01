import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { AllSafeItems, MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'

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
    <SingleAccountItem onLinkClick={onLinkClick} safeItem={item} isSpaceSafe={isSpaceSafe} />
  )
}

const SafesList = ({ safes, onLinkClick, isSpaceSafe = false }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return safes.map((item) => <div key={item.address}>{renderSafeItem(item, onLinkClick, isSpaceSafe)}</div>)
}

export default SafesList
