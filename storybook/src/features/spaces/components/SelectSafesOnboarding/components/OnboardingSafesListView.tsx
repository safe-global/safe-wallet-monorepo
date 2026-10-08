import type { ReactNode } from 'react'
import SecurityBanner from '@views/components/common/TrustedSafesModal/SecurityBanner'

export type OnboardingSafesListSection = 'trusted' | 'owned'

export interface OnboardingSafesListViewProps {
  /** Any look-alike present → shows the top "Verify before you trust" banner. */
  hasFlaggedAddresses: boolean
  hasTrustedSafes: boolean
  hasOwnedSafes: boolean
  renderTable: (section: OnboardingSafesListSection) => ReactNode
}

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
)

export const OnboardingSafesListView = ({
  hasFlaggedAddresses,
  hasTrustedSafes,
  hasOwnedSafes,
  renderTable,
}: OnboardingSafesListViewProps) => (
  <div className="flex w-full min-w-0 flex-col gap-4">
    {hasFlaggedAddresses && <SecurityBanner title="Verify before you trust" />}

    {hasTrustedSafes && (
      <div className="flex flex-col gap-2">
        <SectionLabel>My accounts</SectionLabel>
        {renderTable('trusted')}
      </div>
    )}

    {hasOwnedSafes && (
      <div className="flex flex-col gap-2">
        <SectionLabel>Owned safe accounts</SectionLabel>
        {renderTable('owned')}
      </div>
    )}
  </div>
)
