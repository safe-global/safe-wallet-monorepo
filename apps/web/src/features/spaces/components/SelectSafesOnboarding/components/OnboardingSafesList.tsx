import { type AllSafeItems } from '@/hooks/safes'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { SimilarWarning } from '@/features/address-poisoning'
import { OnboardingSafesListView } from '@views/features/spaces/components/SelectSafesOnboarding/components/OnboardingSafesListView'

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
    <OnboardingSafesListView
      hasFlaggedAddresses={flaggedAddresses.size > 0}
      hasTrustedSafes={trustedSafes.length > 0}
      hasOwnedSafes={ownedSafes.length > 0}
      renderTable={(section) =>
        section === 'trusted' ? (
          <SafeAccountsTable
            items={trustedSafes}
            columns={COLUMNS}
            similarWarnings={similarWarnings}
            similarityGroups={trustedSimilarityGroups}
            selection={selection}
            data-testid="onboarding-trusted-table"
          />
        ) : (
          <SafeAccountsTable
            items={ownedSafes}
            columns={COLUMNS}
            similarWarnings={similarWarnings}
            similarityGroups={ownedSimilarityGroups}
            selection={selection}
            data-testid="onboarding-owned-table"
          />
        )
      }
    />
  )
}

export default OnboardingSafesList
