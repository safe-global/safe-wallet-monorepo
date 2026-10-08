import type { ReactElement, ReactNode } from 'react'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SafeWidgetRoot } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetViewAll } from '@views/features/spaces/components/SafeWidget/WidgetViewAll'
import type { AddAccountsChooserSlotProps } from '@views/features/spaces/components/Dashboard/AddAccountsCardView'

export type DashboardViewProps = {
  announcementModal: ReactNode
  checkoutModal: ReactNode
  previewInvite?: ReactNode
  aggregatedBalance: ReactNode
  isAccountsWidgetReady: boolean
  renderAccountsWidget: (props: { emptyStateAction: ReactNode }) => ReactNode
  renderAddAccountsChooser: (props: AddAccountsChooserSlotProps) => ReactElement
  hasSafes: boolean
  viewAllCount: number
  onViewAll: () => void
  sideWidget: ReactNode
  bottomSetupWidget?: ReactNode
}

export const DashboardView = ({
  announcementModal,
  checkoutModal,
  previewInvite,
  aggregatedBalance,
  isAccountsWidgetReady,
  renderAccountsWidget,
  renderAddAccountsChooser,
  hasSafes,
  viewAllCount,
  onViewAll,
  sideWidget,
  bottomSetupWidget,
}: DashboardViewProps) => {
  return (
    <>
      {announcementModal}
      {checkoutModal}

      {previewInvite}

      <>
        <div>{aggregatedBalance}</div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div data-testid="dashboard-safe-list" className="md:col-span-7">
            {isAccountsWidgetReady ? (
              renderAccountsWidget({
                emptyStateAction: (
                  <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.space_dashboard_card}>
                    {renderAddAccountsChooser({
                      buttonVariant: 'default',
                      buttonLabel: 'Manage accounts',
                      entryPoint: 'dashboard',
                    })}
                  </Track>
                ),
              })
            ) : (
              <SafeWidgetRoot
                title="Accounts"
                action={hasSafes ? <WidgetViewAll count={viewAllCount} onClick={onViewAll} /> : undefined}
                testId="space-dashboard-accounts-widget"
              >
                <div className="animate-pulse rounded-lg bg-muted" />
              </SafeWidgetRoot>
            )}
          </div>
          <div className="md:col-span-5">{sideWidget}</div>
        </div>
        {bottomSetupWidget && <div className="mt-4">{bottomSetupWidget}</div>}
      </>
    </>
  )
}
