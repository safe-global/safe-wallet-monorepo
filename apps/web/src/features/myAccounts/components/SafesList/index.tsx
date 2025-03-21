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

const SafesList = ({ safes, onLinkClick, useTransitions = true, isSpaceSafe = false }: SafeListProps) => {
  if (!safes || safes.length === 0) {
    return null
  }

  return useTransitions ? (
    <TransitionGroup>
      {safes.map((item) => (
        <Collapse key={item.address} timeout="auto">
          {renderSafeItem(item, onLinkClick, isSpaceSafe)}
        </Collapse>
      ))}
    </TransitionGroup>
  ) : (
    <>
      {safes.map((item) => (
        <div key={item.address}>{renderSafeItem(item, onLinkClick, isSpaceSafe)}</div>
      ))}
    </>
  )
}

export default SafesList
