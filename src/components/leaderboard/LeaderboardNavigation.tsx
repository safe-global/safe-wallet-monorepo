import React from 'react'
import { leaderboardNavItems } from '@/components/sidebar/SidebarNavigation/config'
import NavTabs from '../common/NavTabs'

function LeaderboardNavigation() {
  return <NavTabs tabs={leaderboardNavItems} />
}

export default LeaderboardNavigation
