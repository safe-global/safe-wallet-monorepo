import type { ReactNode } from 'react'
import { type AllSafeItems } from '@/hooks/safes'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import SecurityBanner from '@/components/common/TrustedSafesModal/SecurityBanner'

const COLUMNS: SafeAccountColumnId[] = ['name', 'threshold', 'networks', 'balance']

interface SafeListProps {
  trustedSafes: AllSafeItems
  ownedSafes: AllSafeItems
  /** Lowercased owned addresses flagged as similar (address poisoning) — trusted rows are never flagged. */
  flaggedOwnedAddresses: Set<string>
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
  flaggedOwnedAddresses,
  selectedKeys,
  onToggle,
  isAtLimit,
}: SafeListProps) => {
  const selection = { selectedKeys, onToggle, isAtLimit }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {trustedSafes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Trusted safe accounts</SectionLabel>
          <SafeAccountsTable
            items={trustedSafes}
            columns={COLUMNS}
            selection={selection}
            data-testid="onboarding-trusted-table"
          />
        </div>
      )}

      {ownedSafes.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Owned safe accounts</SectionLabel>
          {flaggedOwnedAddresses.size > 0 && <SecurityBanner title="Verify before you trust" />}
          <SafeAccountsTable
            items={ownedSafes}
            columns={COLUMNS}
            flaggedAddresses={flaggedOwnedAddresses}
            selection={selection}
            data-testid="onboarding-owned-table"
          />
        </div>
      )}
    </div>
  )
}

export default OnboardingSafesList
