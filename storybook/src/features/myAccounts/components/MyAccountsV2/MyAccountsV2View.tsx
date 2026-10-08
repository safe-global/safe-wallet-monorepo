import type { ReactNode } from 'react'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import css from '@/features/myAccounts/styles.module.css'
import type { SafeProBannerLocation } from '@/features/safe-pro-announcement/utils/trackSafeProBannerClick'

type BannerSlotProps = { className: string; location: SafeProBannerLocation }

export type MyAccountsV2ViewProps = {
  isDarkMode: boolean
  isSafeProAnnouncementEnabled: boolean
  showGetStarted: boolean
  showEmptyState: boolean
  showList: boolean
  navigation: ReactNode
  renderSafeProWorkspacesBanner: (props: BannerSlotProps) => ReactNode
  renderSafeProBanner: (props: BannerSlotProps) => ReactNode
  getStartedCard: ReactNode
  addTrustedSafesCard: ReactNode
  renderContentCard: (props: { className: string; children: ReactNode }) => ReactNode
  search: ReactNode
  renderSortToggle: (props: { className: string }) => ReactNode
  trustedAccountsActions: ReactNode
  accountsList: ReactNode
  trustedSafesModal: ReactNode
  dataWidget: ReactNode
}

export const MyAccountsV2View = ({
  isDarkMode,
  isSafeProAnnouncementEnabled,
  showGetStarted,
  showEmptyState,
  showList,
  navigation,
  renderSafeProWorkspacesBanner,
  renderSafeProBanner,
  getStartedCard,
  addTrustedSafesCard,
  renderContentCard,
  search,
  renderSortToggle,
  trustedAccountsActions,
  accountsList,
  trustedSafesModal,
  dataWidget,
}: MyAccountsV2ViewProps) => {
  return (
    <div data-testid="sidebar-safe-container" className={css.container}>
      <div className={css.myAccounts}>
        <div className="flex justify-center py-6">{navigation}</div>

        {isSafeProAnnouncementEnabled &&
          (showList
            ? renderSafeProWorkspacesBanner({ className: 'mb-4', location: 'my_accounts' })
            : renderSafeProBanner({ className: 'mx-auto -mb-6 w-full max-w-[440px]', location: 'my_accounts' }))}

        {showGetStarted && getStartedCard}

        {showEmptyState && addTrustedSafesCard}

        {showList &&
          renderContentCard({
            className: 'flex flex-col gap-4',
            children: (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">{search}</div>
                  <ShadcnProvider dark={isDarkMode} className="flex items-center">
                    {renderSortToggle({ className: 'border-border shadow-xs' })}
                  </ShadcnProvider>
                  {trustedAccountsActions}
                </div>

                {accountsList}
              </>
            ),
          })}

        {trustedSafesModal}

        {dataWidget}
      </div>
    </div>
  )
}
