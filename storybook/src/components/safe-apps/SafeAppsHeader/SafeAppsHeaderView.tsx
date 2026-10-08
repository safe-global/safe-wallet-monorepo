import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type SafeAppsHeaderViewProps = {
  chainName?: string
  navTabs: ReactNode
}

export function SafeAppsHeaderView({ chainName, navTabs }: SafeAppsHeaderViewProps): ReactElement {
  return (
    <>
      <div className={css.container}>
        {/* Safe Apps Title */}
        <Typography variant="h3" className={css.title}>
          Explore the {chainName} ecosystem
        </Typography>

        {/* Safe Apps Subtitle */}
        <Typography className={css.subtitle}>
          Connect to your favourite web3 applications with your Safe account, securely and efficiently.
        </Typography>
      </div>

      {/* Safe Apps Tabs */}
      <div className={css.tabs}>{navTabs}</div>
    </>
  )
}
