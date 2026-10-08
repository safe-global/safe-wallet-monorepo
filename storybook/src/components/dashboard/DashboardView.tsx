import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

export type DashboardViewProps = {
  overview: ReactNode
  stakingPromoBanner: ReactNode
  showStakingPromoBanner?: boolean
  noAssets: boolean
  showHnBanner: boolean
  hnBanner: ReactNode
  addFundsBanner: ReactNode
  firstSteps: ReactNode
  isDeployed: boolean
  assetsWidget: ReactNode
  showPositions?: boolean
  positionsWidget: ReactNode
  showSafeApps?: boolean
  explorePossibleWidget: ReactNode
  actionRequiredPanel: ReactNode
  pendingTxsList: ReactNode
  hnPendingBanner: ReactNode
}

export function DashboardView({
  overview,
  stakingPromoBanner,
  showStakingPromoBanner,
  noAssets,
  showHnBanner,
  hnBanner,
  addFundsBanner,
  firstSteps,
  isDeployed,
  assetsWidget,
  showPositions,
  positionsWidget,
  showSafeApps,
  explorePossibleWidget,
  actionRequiredPanel,
  pendingTxsList,
  hnPendingBanner,
}: DashboardViewProps): ReactElement {
  return (
    <>
      <div className={css.dashboardGrid}>
        <div className={css.leftCol}>
          {overview}

          {showStakingPromoBanner && stakingPromoBanner}

          {noAssets && (
            <div className="flex flex-col gap-2">
              {showHnBanner && hnBanner}
              {!showHnBanner && addFundsBanner}
            </div>
          )}

          <div className={css.hideIfEmpty}>{firstSteps}</div>

          {isDeployed && (
            <>
              {assetsWidget}

              {showPositions && <div className={css.hideIfEmpty}>{positionsWidget}</div>}

              {showSafeApps && explorePossibleWidget}
            </>
          )}
        </div>

        <div className={css.rightCol}>
          {actionRequiredPanel}

          {isDeployed && pendingTxsList}

          {hnPendingBanner}
        </div>
      </div>
    </>
  )
}
