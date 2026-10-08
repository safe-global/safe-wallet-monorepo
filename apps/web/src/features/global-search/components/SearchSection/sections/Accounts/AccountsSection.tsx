import { isMultiChainSafeItem } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces'
import { SafeCardReadOnly } from '@/features/spaces'
import type { SectionItemProps } from '../../sectionItems'
import useGlobalSearchFilter from '../../../../hooks/useGlobalSearchFilter'
import useMatchSafe from '@/hooks/useMatchSafe'
import { AccountsSectionView } from '@views/features/global-search/components/SearchSection/sections/Accounts/AccountsSectionView'

const AccountsSection = ({ query, label }: SectionItemProps) => {
  const { allSafes, isLoading } = useSpaceSafes()
  const matchSafe = useMatchSafe()

  const filteredSafes = useGlobalSearchFilter(allSafes, query, matchSafe)

  return (
    <AccountsSectionView
      label={label}
      isLoading={isLoading}
      items={filteredSafes.map((safe, index) => ({
        key: isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`,
        safe,
      }))}
      renderSafeCard={(props) => <SafeCardReadOnly {...props} hideContextMenu showPending={false} />}
    />
  )
}

export default AccountsSection
