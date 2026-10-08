import type { ReactNode } from 'react'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'

export type BalancesViewProps = {
  showStakingPromoBanner?: boolean
  stakingPromoBanner: ReactNode
  showNoFeeCampaignBanner?: boolean
  noFeeCampaignBanner: ReactNode
  renderTotalAssetValue: (props: { title: string; tooltipTitle: string }) => ReactNode
  portfolioRefreshHint: ReactNode
  manageTokensButton: ReactNode
  currencySelect: ReactNode
  hasError: boolean
  assetsTable: ReactNode
}

export const BalancesView = ({
  showStakingPromoBanner,
  stakingPromoBanner,
  showNoFeeCampaignBanner,
  noFeeCampaignBanner,
  renderTotalAssetValue,
  portfolioRefreshHint,
  manageTokensButton,
  currencySelect,
  hasError,
  assetsTable,
}: BalancesViewProps) => {
  return (
    <main>
      {showStakingPromoBanner && <div className="mb-4 empty:hidden">{stakingPromoBanner}</div>}

      {showNoFeeCampaignBanner && <div className="mb-4">{noFeeCampaignBanner}</div>}

      <div className="mb-4">
        <div className="flex flex-row items-center justify-between">
          {renderTotalAssetValue({
            title: 'Total assets value',
            tooltipTitle: 'Total from this list only. Portfolio total includes positions and may use other token data.',
          })}

          <div className="flex flex-col items-end gap-1">
            {portfolioRefreshHint}
            <div className="flex flex-row items-center gap-2">
              {manageTokensButton}
              {currencySelect}
            </div>
          </div>
        </div>
      </div>

      {hasError ? (
        <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
      ) : (
        <>{assetsTable}</>
      )}
    </main>
  )
}
