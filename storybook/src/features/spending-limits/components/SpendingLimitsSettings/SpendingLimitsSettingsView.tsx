import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import AddIcon from '@/public/images/common/add.svg'
import { NoSpendingLimits } from './NoSpendingLimits'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import Track from '@/components/common/Track'

export type SpendingLimitsSettingsViewProps = {
  isEnabled: boolean
  isSupported: boolean
  mustUpgradeToSafePro: boolean
  isPlanLoading: boolean
  showEmptyState: boolean
  table: ReactNode
  onNewSpendingLimit: () => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
  renderSafeProLock: (title: string) => ReactNode
}

export const SpendingLimitsSettingsView = ({
  isEnabled,
  isSupported,
  mustUpgradeToSafePro,
  isPlanLoading,
  showEmptyState,
  table,
  onNewSpendingLimit,
  renderCheckWallet,
  renderSafeProLock,
}: SpendingLimitsSettingsViewProps) => {
  const renderNewSpendingLimitButton = renderCheckWallet((isOk) => (
    <Track {...SETTINGS_EVENTS.SPENDING_LIMIT.NEW_LIMIT}>
      <Button data-testid="new-spending-limit" onClick={onNewSpendingLimit} className="my-4" disabled={!isOk}>
        <AddIcon className="size-4" />
        New spending limit
      </Button>
    </Track>
  ))

  return (
    <div data-testid="spending-limit-section" className="bg-card text-card-foreground rounded-lg p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className="font-bold">
            Spending limits
          </Typography>
        </div>

        <div className="lg:min-w-0 lg:flex-1">
          {isEnabled ? (
            <div>
              <Typography>
                You can set rules for specific beneficiaries to access funds from this Safe account without having to
                collect all signatures.
              </Typography>

              {isSupported ? (
                mustUpgradeToSafePro ? (
                  <div className="my-4">{renderSafeProLock('Adding spending limits requires Safe Pro')}</div>
                ) : (
                  !isPlanLoading && renderNewSpendingLimitButton
                )
              ) : (
                <Typography className="mt-4 block">
                  The spending limit module isn&apos;t deployed on this chain yet, so new spending limits can&apos;t be
                  created here.
                </Typography>
              )}

              {showEmptyState && <NoSpendingLimits />}
              {table}
            </div>
          ) : (
            <Typography>The spending limit feature is not yet available on this chain.</Typography>
          )}
        </div>
      </div>
    </div>
  )
}
