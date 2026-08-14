import type { ReactNode } from 'react'
import { type AllSafeItems } from '@/hooks/safes'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { SimilarWarning } from '@/features/address-poisoning'
import SecurityBanner from '@/components/common/TrustedSafesModal/SecurityBanner'

const COLUMNS: SafeAccountColumnId[] = ['name', 'threshold', 'networks', 'balance']

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
  /** Any look-alike present → shows the top "Verify before you trust" banner. */
  flaggedAddresses: Set<string>
  /** Address → cluster id per section; each list bands its own members (cross-list singles = one card). */
  trustedSimilarityGroups: Map<string, string>
  ownedSimilarityGroups: Map<string, string>
  /** Address → cross-list peers; drives the inline ⚠️ + tooltip (only clusters spanning both lists). */
  similarWarnings: Map<string, SimilarWarning>
  selectedKeys: Set<string>
  onToggle: (line: AccountLine, nextChecked: boolean) => void
  isAtLimit: boolean
}

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
)

const OnboardingSafesList = ({
  trustedSafes,
  ownedSafes,
  flaggedAddresses,
  trustedSimilarityGroups,
  ownedSimilarityGroups,
  similarWarnings,
  selectedKeys,
  onToggle,
  isAtLimit,
}: SafeListProps) => {
  const selection = { selectedKeys, onToggle, isAtLimit }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {flaggedAddresses.size > 0 && <SecurityBanner title="Verify before you trust" />}

      {trustedSafes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>My accounts</SectionLabel>
          <SafeAccountsTable
            items={trustedSafes}
            columns={COLUMNS}
            similarWarnings={similarWarnings}
            similarityGroups={trustedSimilarityGroups}
            selection={selection}
            data-testid="onboarding-trusted-table"
          />
        </div>
      )}

      {ownedSafes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Owned safe accounts</SectionLabel>
          <SafeAccountsTable
            items={ownedSafes}
            columns={COLUMNS}
            similarWarnings={similarWarnings}
            similarityGroups={ownedSimilarityGroups}
            selection={selection}
            data-testid="onboarding-owned-table"
          />
        </div>
      )}
    </div>
  )
}

export default OnboardingSafesList
