import type SafeProBanner from './components/SafeProBanner'
import type SafeProSidebarBanner from './components/SafeProSidebarBanner'
import type SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export interface SafeProContract {
  SafeProBanner: typeof SafeProBanner
  SafeProSidebarBanner: typeof SafeProSidebarBanner
  SafeProWorkspacesBanner: typeof SafeProWorkspacesBanner
}
