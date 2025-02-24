import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import { TransitionGroup } from 'react-transition-group'
import { Collapse } from '@mui/material'

export type SafeListProps = {
  safes?: (SafeItem | MultiChainSafeItem)[]
  onLinkClick?: () => void
  useTransitions?: boolean
  isOrgSafe?: boolean
}

const renderSafeItem = (
  item: SafeItem | MultiChainSafeItem,
  onLinkClick?: SafeListProps['onLinkClick'],
  isOrgSafe = false,
) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem onLinkClick={onLinkClick} multiSafeAccountItem={item} isOrgSafe={isOrgSafe} />
  ) : (
    <SingleAccountItem onLinkClick={onLinkClick} safeItem={item} isOrgSafe={isOrgSafe} />
  )
}

const SafesList = ({ safes, onLinkClick, useTransitions = true, isOrgSafe = false }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return useTransitions ? (
    <TransitionGroup>
      {safes.map((item) => (
        <Collapse key={item.address} timeout="auto">
          {renderSafeItem(item, onLinkClick, isOrgSafe)}
        </Collapse>
      ))}
    </TransitionGroup>
  ) : (
    <>
      {safes.map((item) => (
        <div key={item.address}>{renderSafeItem(item, onLinkClick, isOrgSafe)}</div>
      ))}
    </>
  )
}

export default SafesList
