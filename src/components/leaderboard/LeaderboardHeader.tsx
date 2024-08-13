import React from 'react'
import PageHeader from '@/components/common/PageHeader'
import css from '@/components/common/PageHeader/styles.module.css'
import LeaderboardNavigation from './LeaderboardNavigation'
function LeaderboardHeader({ children }: { children?: React.ReactNode }) {
  return (
    <PageHeader
      title="Leaderboard"
      action={
        <div className={css.pageHeader}>
          <div className={css.navWrapper}>
            <LeaderboardNavigation />
          </div>
          {children && <div className={css.actionsWrapper}>{children}</div>}
        </div>
      }
    />
  )
}

export default LeaderboardHeader
