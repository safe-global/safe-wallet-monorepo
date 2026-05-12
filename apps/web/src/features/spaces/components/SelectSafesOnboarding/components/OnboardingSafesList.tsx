import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import SafeCard from './SafeCard'
import SimilarAddressAlert from './SimilarAddressAlert'
import SelectAllToggle, { type SelectAllState } from '@/features/spaces/components/SelectAllToggle/SelectAllToggle'

interface SectionSelectAll {
  state: SelectAllState
  count: number
  total: number
  onToggle: (check: boolean) => void
}

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
  similarAddresses: Set<string>
  trustedSelectAll?: SectionSelectAll
  ownedSelectAll?: SectionSelectAll
}

const renderSafeCards = (safes: AllSafeItems, similarAddresses: Set<string>) =>
  safes.map((safe, index) => {
    const isSimilar = similarAddresses.has(safe.address.toLowerCase())
    if (isMultiChainSafeItem(safe)) {
      return <SafeCard key={`multi-${safe.address}-${index}`} safe={safe} isSimilar={isSimilar} />
    }
    return <SafeCard key={`${safe.chainId}:${safe.address}`} safe={safe} isSimilar={isSimilar} />
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
        label="Select all"
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
}: SafeListProps) => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      {trustedSafes.length > 0 && (
        <>
          <SectionRow label="Trusted safes" selectAll={trustedSelectAll} testId="select-all-trusted" />
          {renderSafeCards(trustedSafes, similarAddresses)}
        </>
      )}

      {ownedSafes.length > 0 && (
        <>
          <SectionRow label="Owned safes" selectAll={ownedSelectAll} testId="select-all-owned" />
          {renderSafeCards(ownedSafes, similarAddresses)}
        </>
      )}
    </div>
  )
}

export default OnboardingSafesList
