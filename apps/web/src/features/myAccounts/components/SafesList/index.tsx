import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import MultiAccountItem from '@/features/myAccounts/components/AccountItems/MultiAccountItem'
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { Collapse } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'

type SafeListProps = {
  safes?: (SafeItem | MultiChainSafeItem)[]
  onLinkClick?: () => void
  useTransitions?: boolean
}

const renderSafeItem = (item: SafeItem | MultiChainSafeItem, onLinkClick?: () => void) => {
  return isMultiChainSafeItem(item) ? (
    <MultiAccountItem onLinkClick={onLinkClick} multiSafeAccountItem={item} />
  ) : (
    <SingleAccountItem onLinkClick={onLinkClick} safeItem={item} />
  )
}

const SafesList = ({ safes, onLinkClick, useTransitions = true }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return useTransitions ? (
    <TransitionGroup>
      {safes.map((item) => (
        <Collapse key={item.address} timeout="auto">
          {renderSafeItem(item, onLinkClick)}
        </Collapse>
      ))}
    </TransitionGroup>
  ) : (
    <>
      {safes.map((item) => (
        <div key={item.address}>{renderSafeItem(item, onLinkClick)}</div>
      ))}
    </>
  )
}

export default SafesList
