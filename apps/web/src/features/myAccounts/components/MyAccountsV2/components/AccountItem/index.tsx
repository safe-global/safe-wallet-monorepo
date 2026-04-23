import { isMultiChainSafeItem, type MultiChainSafeItem, type SafeItem } from '@/hooks/safes'
import SingleAccountItem from './SingleAccountItem'
import MultiAccountItem from './MultiAccountItem'

type AccountItemProps = {
  safe: SafeItem | MultiChainSafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const AccountItem = ({ safe, onLinkClick, isSpaceSafe = false }: AccountItemProps) => {
  if (isMultiChainSafeItem(safe)) {
    return <MultiAccountItem multiSafeAccountItem={safe} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} />
  }
  return <SingleAccountItem safeItem={safe} onLinkClick={onLinkClick} isSpaceSafe={isSpaceSafe} />
}

export default AccountItem
