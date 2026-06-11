import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from './SafeCard'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import SelectAllToggle, { type SelectAllState } from '@/features/spaces/components/SelectAllToggle/SelectAllToggle'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/components/Sidebar/constants'

interface SectionSelectAll {
  state: SelectAllState
  count: number
  total: number
  onToggle: (check: boolean) => void
  disabled?: boolean
}

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
  similarAddresses: Set<string>
  trustedSelectAll?: SectionSelectAll
  ownedSelectAll?: SectionSelectAll
  isAtLimit?: boolean
}

const renderSafeCards = (safes: AllSafeItems, similarAddresses: Set<string>, isAtLimit: boolean) =>
  safes.map((safe, index) => {
    const isSimilar = similarAddresses.has(safe.address.toLowerCase())
    if (isMultiChainSafeItem(safe)) {
      return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} isSimilar={isSimilar} isAtLimit={isAtLimit} />
    }
    return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} isSimilar={isSimilar} isAtLimit={isAtLimit} />
  })

const SectionRow = ({ label, selectAll, testId }: { label: string; selectAll?: SectionSelectAll; testId?: string }) => (
  <div className="flex items-center justify-between px-2 pb-1 pt-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    {selectAll && selectAll.total > 0 && (
      <SelectAllToggle
        state={selectAll.state}
        count={selectAll.count}
        total={selectAll.total}
        onToggle={selectAll.onToggle}
        disabled={selectAll.disabled}
        label="Select all"
        labelTooltip={`You can select up to ${SAFE_ACCOUNTS_LIMIT} Safe accounts`}
        showCount
        countTooltip="Multi-chain safes count once per network"
        testId={testId}
        className="py-0"
      />
    )}
  </div>
)

const OnboardingSafesList = ({
  trustedSafes,
  ownedSafes,
  similarAddresses,
  trustedSelectAll,
  ownedSelectAll,
  isAtLimit = false,
}: SafeListProps) => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      {trustedSafes.length > 0 && (
        <>
          <SectionRow label="Trusted safes" selectAll={trustedSelectAll} testId="select-all-trusted" />
          {renderSafeCards(trustedSafes, similarAddresses, isAtLimit)}
        </>
      )}

      {ownedSafes.length > 0 && (
        <>
          <SectionRow label="Owned safes" selectAll={ownedSelectAll} testId="select-all-owned" />
          {renderSafeCards(ownedSafes, similarAddresses, isAtLimit)}
        </>
      )}
    </div>
  )
}

export default OnboardingSafesList
