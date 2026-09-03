import type { SafeProContract } from './contract'

import SafeProAnnouncement from './components/SafeProAnnouncement'
import SafeProAnnouncementModal from './components/SafeProAnnouncementModal'
import SafeProLockedWorkspace from './components/SafeProLockedWorkspace'
import SafeProTrialActivatedModal from './components/SafeProTrialActivatedModal'
import SafeProBillingReminderModal from './components/SafeProBillingReminderModal'
import SafeProBanner from './components/SafeProBanner'
import SafeProSidebarBanner from './components/SafeProSidebarBanner'
import SafeProWorkspacesBanner from './components/SafeProWorkspacesBanner'

export default {
  SafeProAnnouncement,
  SafeProAnnouncementModal,
  SafeProLockedWorkspace,
  SafeProTrialActivatedModal,
  SafeProBillingReminderModal,
  SafeProBanner,
  SafeProSidebarBanner,
  SafeProWorkspacesBanner,
} satisfies SafeProContract
