import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { AllSafeItems, MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'

type SafeListProps = {
  safes?: AllSafeItems
  onLinkClick?: () => void
}

const renderSafeItem = (item: SafeItem | MultiChainSafeItem, onLinkClick?: () => void) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem onLinkClick={onLinkClick} multiSafeAccountItem={item} />
  ) : (
    <SingleAccountItem onLinkClick={onLinkClick} safeItem={item} />
  )
}

const SafesList = ({ safes, onLinkClick }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return safes.map((item) => <div key={item.address}>{renderSafeItem(item, onLinkClick)}</div>)
}

export default SafesList
