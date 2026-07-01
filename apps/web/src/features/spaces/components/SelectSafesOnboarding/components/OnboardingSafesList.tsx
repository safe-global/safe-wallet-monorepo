import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import type { SelectionSimilarity } from '@/features/address-poisoning'
import SafeCard from './SafeCard'
import SelectAllToggle, { type SelectAllState } from '../../SelectAllToggle/SelectAllToggle'
import { Typography } from '@/components/ui/typography'
import { SAFE_ACCOUNTS_LIMIT, safeAccountsLimitReachedText } from '@/features/spaces/constants'

type SimilarityMap = Map<string, SelectionSimilarity>

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
  similarities: SimilarityMap
  trustedSelectAll?: SectionSelectAll
  ownedSelectAll?: SectionSelectAll
  isAtLimit?: boolean
}

const renderSafeCards = (safes: AllSafeItems, similarities: SimilarityMap, isAtLimit: boolean) =>
  safes.map((safe, index) => {
    const similarity = similarities.get(safe.address.toLowerCase())
    const key = isMultiChainSafeItem(safe) ? `multi-${safe.address}-${index}` : `${safe.chainId}:${safe.address}`
    return (
      <SafeCard
        key={key}
        safe={safe}
        match={similarity?.match}
        intraList={similarity?.intraList}
        isAtLimit={isAtLimit}
      />
    )
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
  similarities,
  trustedSelectAll,
  ownedSelectAll,
  isAtLimit = false,
}: SafeListProps) => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {isAtLimit && (
        <Typography variant="paragraph" className="text-destructive text-xs pb-1">
          {safeAccountsLimitReachedText()}
        </Typography>
      )}

      {trustedSafes.length > 0 && (
        <>
          <SectionRow label="Trusted safes" selectAll={trustedSelectAll} testId="select-all-trusted" />
          {renderSafeCards(trustedSafes, similarities, isAtLimit)}
        </>
      )}

      {ownedSafes.length > 0 && (
        <>
          <SectionRow label="Owned safes" selectAll={ownedSelectAll} testId="select-all-owned" />
          {renderSafeCards(ownedSafes, similarities, isAtLimit)}
        </>
      )}
    </div>
  )
}

export default OnboardingSafesList
