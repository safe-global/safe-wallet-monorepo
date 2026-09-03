import type SafeProAnnouncement from './components/SafeProAnnouncement'
import type SafeProAnnouncementModal from './components/SafeProAnnouncementModal'
import type SafeProLockedWorkspace from './components/SafeProLockedWorkspace'
import type SafeProBanner from './components/SafeProBanner'
import type SafeProSidebarBanner from './components/SafeProSidebarBanner'
import type SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export interface SafeProContract {
  SafeProAnnouncement: typeof SafeProAnnouncement
  SafeProAnnouncementModal: typeof SafeProAnnouncementModal
  SafeProLockedWorkspace: typeof SafeProLockedWorkspace
  SafeProBanner: typeof SafeProBanner
  SafeProSidebarBanner: typeof SafeProSidebarBanner
  SafeProWorkspacesBanner: typeof SafeProWorkspacesBanner
}
