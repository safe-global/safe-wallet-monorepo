import type SafeProAnnouncementModal from './components/SafeProAnnouncementModal'
import type SafeProBanner from './components/SafeProBanner'
import type SafeProSidebarBanner from './components/SafeProSidebarBanner'
import type SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export interface SafeProContract {
  SafeProAnnouncementModal: typeof SafeProAnnouncementModal
  SafeProBanner: typeof SafeProBanner
  SafeProSidebarBanner: typeof SafeProSidebarBanner
  SafeProWorkspacesBanner: typeof SafeProWorkspacesBanner
}
